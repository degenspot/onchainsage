import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { Signal, SignalStatus } from '../signals/entities/signal.entity';
import { SignalGateway } from '../gateways/signal.gateway';
import { SignalsService } from 'src/signals/signals.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignalTask {
  private readonly logger = new Logger(SignalTask.name);
  private readonly signalTypes = ['PRICE_BREAKOUT', 'VOLUME_SPIKE', 'TREND_REVERSAL', 'MOMENTUM_SHIFT'];
  private readonly confidenceLevels = ['HIGH', 'MEDIUM', 'LOW'];
  private readonly statuses = [SignalStatus.ACTIVE, SignalStatus.PENDING, SignalStatus.SUCCESSFUL, SignalStatus.FAILED];

  constructor(
    @InjectRepository(Signal)
    private readonly signalRepository: Repository<Signal>,
    private readonly signalGateway: SignalGateway,
    private readonly signalService: SignalsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredSignals() {
    try {
      const expirationDays = this.configService.get<number>('app.signalExpirationDays');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - expirationDays);

      const result = await this.signalRepository.update(
        {
          timestamp: LessThan(cutoffDate),
          status: Not(SignalStatus.EXPIRED),
        },
        { status: SignalStatus.EXPIRED },
      );

      if (result.affected && result.affected > 0) {
        this.logger.log(`Marked ${result.affected} signals as expired`);
      }
    } catch (error) {
      this.logger.error(`Error checking expired signals: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async generateMockSignal() {
    try {
      const mockSignal = this.signalRepository.create({
        signal_type: this.getRandomElement(this.signalTypes),
        value: this.getRandomValue(100, 10000),
        status: this.getRandomElement(this.statuses),
        confidence_level: this.getRandomElement(this.confidenceLevels),
        historical_performance: {
          success_rate: this.getRandomValue(0.5, 0.95),
          total_signals: Math.floor(this.getRandomValue(100, 1000)),
          successful_signals: Math.floor(this.getRandomValue(50, 500)),
          failed_signals: Math.floor(this.getRandomValue(10, 100)),
          average_return: this.getRandomValue(0.05, 0.25),
        },
      });

      const savedSignal = await this.signalRepository.save(mockSignal);
      this.logger.log(`Generated new mock signal: ${JSON.stringify(savedSignal)}`);

      this.signalGateway.broadcastNewSignal(savedSignal);

      await this.signalService.invalidateTopSignalsCache();
    } catch (error) {
      this.logger.error(`Error generating mock signal: ${error.message}`);
    }
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomValue(min: number, max: number): number {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  }
}
