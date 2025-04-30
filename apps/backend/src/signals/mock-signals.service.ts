import { Injectable, NotFoundException } from '@nestjs/common';
import { Signal, SignalStatus } from './entities/signal.entity';

@Injectable()
export class MockSignalService {
  private readonly signalTypes = ['price_movement', 'volume_spike', 'social_sentiment', 'technical_indicator'];
  private readonly confidenceLevels = ['high', 'medium', 'low'];
  private readonly statuses = [SignalStatus.SUCCESSFUL, SignalStatus.FAILED, SignalStatus.PENDING];

  private signals: Signal[] = [];

  constructor() {
    // Generate a larger dataset of 50 signals for testing pagination
    this.signals = Array.from({ length: 50 }, () => this.generateSingleSignal());
  }

  generateSingleSignal(): Signal {
    const timestamp = new Date();
    const status: SignalStatus = this.statuses[Math.floor(Math.random() * this.statuses.length)];
    return {
      signal_id: Date.now(), // Temporary ID (will be overridden by DB if saved)
      timestamp, // Matches timestamptz
      expiresAt: new Date(timestamp.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      signal_type: this.signalTypes[Math.floor(Math.random() * this.signalTypes.length)],
      value: Number.parseFloat((Math.random() * 10 - 5).toFixed(2)), // Matches numeric(10,2)
      status,
      confidence_level: this.confidenceLevels[Math.floor(Math.random() * this.confidenceLevels.length)],
      historical_performance: {
        success_rate: Math.random(),
        total_signals: Math.floor(Math.random() * 100),
        successful_signals: Math.floor(Math.random() * 50),
        failed_signals: Math.floor(Math.random() * 50),
        average_return: Number.parseFloat((Math.random() * 10 - 5).toFixed(2)),
        last_updated: timestamp,
      },
      is_verified: Math.random() > 0.5, // Randomly true or false
    };
  }

  generateMockSignals(page: number = 1, limit: number = 10): { data: Signal[]; total: number } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      data: this.signals.slice(startIndex, endIndex),
      total: this.signals.length
    };
  }

  getMockSignalById(id: number): Signal {
    const signal = this.signals.find((signal) => signal.signal_id === id);
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`);
    }
    return signal;
  }
}