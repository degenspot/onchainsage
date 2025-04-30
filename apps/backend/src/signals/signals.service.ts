import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Signal, SignalStatus } from './entities/signal.entity';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { RankingOptions, WeightedSignal } from './interfaces/ranking.interface';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);
  private readonly CACHE_KEY = 'signals:all';
  private readonly TOP_SIGNALS_CACHE_KEY = 'signals:top';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectRepository(Signal)
    private readonly signalRepository: Repository<Signal>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(page = 1, limit = 10): Promise<{ data: Signal[]; total: number }> {
    const cachedSignals = await this.getCachedSignals();
    if (cachedSignals) {
      return {
        data: cachedSignals.slice((page - 1) * limit, page * limit),
        total: cachedSignals.length,
      };
    }

    const [signals, total] = await this.signalRepository.findAndCount({
      where: { status: Not(SignalStatus.EXPIRED) },
      take: limit,
      skip: (page - 1) * limit,
      order: { timestamp: 'DESC' },
    });

    await this.cacheSignals(signals);

    return { data: signals, total };
  }

  private async getCachedSignals(): Promise<Signal[] | null> {
    try {
      const cachedData = await this.redisService.getAsync(this.CACHE_KEY);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      this.logger.error('Error retrieving signals from cache:', error);
      return null;
    }
  }

  private async cacheSignals(signals: Signal[]): Promise<void> {
    try {
      await this.redisService.setAsync(this.CACHE_KEY, JSON.stringify(signals), this.CACHE_TTL);
    } catch (error) {
      this.logger.error('Error caching signals:', error);
    }
  }

  async getOneSignalById(signal_id: number): Promise<Signal> {
    const signal = await this.signalRepository.findOne({ where: { signal_id } });
    if (!signal) throw new NotFoundException(`Signal #${signal_id} not found`);
    return signal;
  }

  async getTopSignals(page = 1, limit = 10, filter?: string): Promise<{ data: Signal[]; total: number }> {
    try {
      const cacheKey = `${this.TOP_SIGNALS_CACHE_KEY}:${filter || 'all'}`;
      const cachedSignals = await this.redisService.getAsync(cacheKey);

      if (cachedSignals) {
        const signals = JSON.parse(cachedSignals);
        return {
          data: signals.slice((page - 1) * limit, page * limit),
          total: signals.length,
        };
      }

      const queryBuilder = this.signalRepository.createQueryBuilder('signal');
      if (filter) queryBuilder.where('signal.signal_type = :filter', { filter });

      const total = await queryBuilder.getCount();
      const signals = await queryBuilder
        .orderBy('signal.timestamp', 'DESC')
        .take(Math.min(total, 500))
        .getMany();

      const rankedSignals = this.rankSignals(signals);
      await this.redisService.setAsync(cacheKey, JSON.stringify(rankedSignals), this.CACHE_TTL);

      return {
        data: rankedSignals.slice((page - 1) * limit, page * limit),
        total,
      };
    } catch (error) {
      this.logger.error(`Error fetching top signals: ${error.message}`);
      throw new Error('Failed to fetch top signals');
    }
  }

  private rankSignals(signals: Signal[], options?: RankingOptions): Signal[] {
    const now = new Date();
    const config: Required<RankingOptions> = {
      decayFactor: options?.decayFactor ?? 0.01,
      maxAgeHours: options?.maxAgeHours ?? 168,
      reputationWeight: options?.reputationWeight ?? 0.7,
      recencyWeight: options?.recencyWeight ?? 0.3,
    };

    const weightedSignals: WeightedSignal<Signal>[] = signals.map((signal) => {
      const ageInHours = (now.getTime() - signal.timestamp.getTime()) / (1000 * 60 * 60);
      if (ageInHours > config.maxAgeHours) return { signal, weight: 0 };

      const recencyScore = Math.exp(-config.decayFactor * ageInHours);
      let reputationScore = 0.5;

      if (signal.historical_performance?.success_rate) {
        reputationScore = signal.historical_performance.success_rate;
      } else if (signal.confidence_level) {
        switch (signal.confidence_level.toLowerCase()) {
          case 'high':
            reputationScore = 0.9;
            break;
          case 'medium':
            reputationScore = 0.6;
            break;
          case 'low':
            reputationScore = 0.3;
            break;
        }
      }

      const weight = reputationScore * config.reputationWeight + recencyScore * config.recencyWeight;
      return { signal, weight };
    });

    return weightedSignals
      .sort((a, b) => b.weight - a.weight)
      .map((item) => item.signal);
  }

  async invalidateTopSignalsCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys(`${this.TOP_SIGNALS_CACHE_KEY}:*`);
      for (const key of keys) await this.redisService.del(key);
    } catch (error) {
      this.logger.error(`Error invalidating top signals cache: ${error.message}`);
    }
  }

  async invalidateCache(): Promise<void> {
    try {
      await this.redisService.del(this.CACHE_KEY);
      await this.invalidateTopSignalsCache();
    } catch (error) {
      this.logger.error(`Error invalidating signals cache: ${error.message}`);
    }
  }

  async getLatestSignals(limit: number = 10): Promise<Signal[]> {
    return this.signalRepository.find({
      where: { status: Not(SignalStatus.EXPIRED) },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async restoreSignal(signal_id: number): Promise<Signal> {
    const signal = await this.getOneSignalById(signal_id);
    if (signal.status !== SignalStatus.EXPIRED) {
      throw new Error('Signal is not expired');
    }
    signal.status = SignalStatus.ACTIVE;
    signal.timestamp = new Date();
    await this.signalRepository.save(signal);
    await this.invalidateCache();
    return signal;
  }

  async extendSignal(signal_id: number): Promise<Signal> {
    const signal = await this.getOneSignalById(signal_id);
    signal.timestamp = new Date();
    if (signal.status === SignalStatus.EXPIRED) {
      signal.status = SignalStatus.ACTIVE;
    }
    await this.signalRepository.save(signal);
    await this.invalidateCache();
    return signal;
  }

  async calculateHistoricalPerformance(signalType: string, confidenceLevel: string): Promise<any> {
    const signals = await this.signalRepository.find({
      where: {
        signal_type: signalType,
        confidence_level: confidenceLevel,
        is_verified: true,
      },
    });

    const totalSignals = signals.length;
    const successfulSignals = signals.filter((s) => s.status === SignalStatus.SUCCESSFUL).length;
    const failedSignals = signals.filter((s) => s.status === SignalStatus.FAILED).length;
    const successRate = totalSignals > 0 ? successfulSignals / totalSignals : 0;
    const totalReturn = signals.reduce((sum, s) => sum + Number(s.value), 0);
    const averageReturn = totalSignals > 0 ? totalReturn / totalSignals : 0;

    return {
      success_rate: successRate,
      total_signals: totalSignals,
      successful_signals: successfulSignals,
      failed_signals: failedSignals,
      average_return: averageReturn,
      last_updated: new Date(),
    };
  }

  async updateHistoricalPerformance(signalType: string, confidenceLevel: string): Promise<void> {
    const performance = await this.calculateHistoricalPerformance(signalType, confidenceLevel);
    await this.signalRepository.update(
      { signal_type: signalType, confidence_level: confidenceLevel },
      { historical_performance: performance },
    );
  }

  async createSignal(signalData: Partial<Signal>): Promise<Signal> {
    const performance = await this.calculateHistoricalPerformance(
      signalData.signal_type,
      signalData.confidence_level,
    );
    const signal = this.signalRepository.create({
      ...signalData,
      historical_performance: performance,
    });
    return this.signalRepository.save(signal);
  }

  async generateMockHistoricalData(): Promise<void> {
    const mockSignals = [
      { signal_type: 'price_movement', confidence_level: 'high', value: 5.2, status: SignalStatus.SUCCESSFUL, is_verified: true },
      { signal_type: 'price_movement', confidence_level: 'high', value: -2.1, status: SignalStatus.FAILED, is_verified: true },
      { signal_type: 'volume_spike', confidence_level: 'medium', value: 3.7, status: SignalStatus.SUCCESSFUL, is_verified: true },
      { signal_type: 'social_sentiment', confidence_level: 'high', value: 8.1, status: SignalStatus.SUCCESSFUL, is_verified: true },
      { signal_type: 'technical_indicator', confidence_level: 'low', value: 1.5, status: SignalStatus.FAILED, is_verified: true },
    ];

    for (const mockSignal of mockSignals) {
      await this.createSignal(mockSignal);
    }
  }
}
