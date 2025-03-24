// src/services/signal.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signal } from '../entities/signal.entity';

@Injectable()
export class SignalsService {
  constructor(
    @InjectRepository(Signal)
    private readonly signalRepository: Repository<Signal>,
  ) {}

  // Fetches 100 signals ordered by timestamp (DESC)
  async findAll(): Promise<Signal[]> {
    return this.signalRepository.find({
      take: 100,
      order: { timestamp: 'DESC' },
    });
  }

  // Fetch a single signal by its ID
  async getOneSignalById(signal_id: number): Promise<Signal | undefined> {
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
