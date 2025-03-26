// src/services/signal.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signal } from '../entities/signal.entity';
import { RedisService } from '../redis/redis.service'; // Import existing Redis service

@Injectable()
export class SignalsService {
  private readonly CACHE_KEY = 'signals:all';
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectRepository(Signal)
    private readonly signalRepository: Repository<Signal>,
    private readonly redisService: RedisService, // Inject Redis service
  ) {}

  // Fetches signals ordered by timestamp (DESC) with pagination
  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Signal[], total: number }> {
    // Try to get signals from cache first
    const cachedSignals = await this.getCachedSignals();
    if (cachedSignals) {
      return {
        data: cachedSignals.slice((page - 1) * limit, page * limit),
        total: cachedSignals.length,
      };
    }

    // If not in cache, get from repository
    const [signals, total] = await this.signalRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { timestamp: 'DESC' },
    });

    // Cache the signals
    await this.cacheSignals(signals);
    
    return {
      data: signals,
      total: total,
    };
  }

  // Get signals from Redis cache
  private async getCachedSignals(): Promise<Signal[] | null> {
    try {
      const cachedData = await this.redisService.getAsync(this.CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving signals from cache:', error);
      return null;
    }
  }

  // Cache signals in Redis
  private async cacheSignals(signals: Signal[]): Promise<void> {
    try {
      await this.redisService.setAsync(
        this.CACHE_KEY,
        JSON.stringify(signals),
        this.CACHE_TTL
      );
    } catch (error) {
      console.error('Error caching signals:', error);
    }
  }

  // Invalidate cache when new signals are added
  async invalidateCache(): Promise<void> {
    try {
      await this.redisService.del(this.CACHE_KEY);
    } catch (error) {
      console.error('Error invalidating signals cache:', error);
    }
  }

  // Fetch a single signal by its ID
  async getOneSignalById(signal_id: number): Promise<Signal> {
    return this.signalRepository.findOne({ where: { signal_id } });
  }

  // Calculate historical performance for a signal type and confidence level
  async calculateHistoricalPerformance(signalType: string, confidenceLevel: string): Promise<any> {
    const signals = await this.signalRepository.find({
      where: {
        signal_type: signalType,
        confidence_level: confidenceLevel,
        is_verified: true, // Only consider verified signals
      },
    });

    const totalSignals = signals.length;
    const successfulSignals = signals.filter(s => s.status === 'successful').length;
    const failedSignals = signals.filter(s => s.status === 'failed').length;
    const successRate = totalSignals > 0 ? successfulSignals / totalSignals : 0;

    // Calculate average return (assuming value field represents return percentage)
    const totalReturn = signals.reduce((sum, signal) => sum + Number(signal.value), 0);
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

  // Update historical performance for all signals of a given type
  async updateHistoricalPerformance(signalType: string, confidenceLevel: string): Promise<void> {
    const performance = await this.calculateHistoricalPerformance(signalType, confidenceLevel);
    
    await this.signalRepository.update(
      { signal_type: signalType, confidence_level: confidenceLevel },
      { historical_performance: performance }
    );
  }

  // Create a new signal with historical performance
  async createSignal(signalData: Partial<Signal>): Promise<Signal> {
    const performance = await this.calculateHistoricalPerformance(
      signalData.signal_type,
      signalData.confidence_level
    );

    const signal = this.signalRepository.create({
      ...signalData,
      historical_performance: performance,
    });

    return this.signalRepository.save(signal);
  }

  // Generate mock historical data for testing
  async generateMockHistoricalData(): Promise<void> {
    const mockSignals = [
      {
        signal_type: 'price_movement',
        confidence_level: 'high',
        value: 5.2,
        status: 'successful',
        is_verified: true,
      },
      {
        signal_type: 'price_movement',
        confidence_level: 'high',
        value: -2.1,
        status: 'failed',
        is_verified: true,
      },
      {
        signal_type: 'volume_spike',
        confidence_level: 'medium',
        value: 3.7,
        status: 'successful',
        is_verified: true,
      },
      {
        signal_type: 'social_sentiment',
        confidence_level: 'high',
        value: 8.1,
        status: 'successful',
        is_verified: true,
      },
      {
        signal_type: 'technical_indicator',
        confidence_level: 'low',
        value: 1.5,
        status: 'failed',
        is_verified: true,
      }
    ];

    // Create mock signals
    for (const mockSignal of mockSignals) {
      await this.createSignal(mockSignal);
    }
  }
}