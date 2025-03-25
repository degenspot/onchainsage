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

  // Fetches 100 signals ordered by timestamp (DESC)
  async findAll(): Promise<Signal[]> {
    // Try to get signals from cache first
    const cachedSignals = await this.getCachedSignals();
    if (cachedSignals) {
      return cachedSignals;
    }

    // If not in cache, get from repository
    const signals = await this.signalRepository.find({
      take: 100,
      order: { timestamp: 'DESC' },
    });

    // Cache the signals
    await this.cacheSignals(signals);
    
    return signals;
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

  // Optional: Log performance of the query
  async findAllWithPerformance(): Promise<Signal[]> {
    const start = Date.now();
    const signals = await this.signalRepository.createQueryBuilder('signal')
      .orderBy('signal.timestamp', 'DESC')
      .limit(100)
      .getMany();
    console.log(`Query executed in ${Date.now() - start}ms`);
    return signals;
  }
}