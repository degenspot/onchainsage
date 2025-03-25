import { Controller, Get, Param, Post } from '@nestjs/common';
import { SignalsService } from './signals.service'; 
import { MockSignalService } from './mock-signals.service'; 
import { TradingSignal } from '../interfaces/trading-signal.interface';

@Controller('signals')
export class SignalsController {
  constructor(
    private readonly signalsService: SignalsService,
    private readonly mockSignalsService: MockSignalService
  ) {}

  @Get()
  findAll() {
    return this.signalsService.findAll();
  }

  @Get('mock')
  getMockSignals(): TradingSignal[] {
    // Get mock signals from the service
    const mockSignals = this.mockSignalsService.generateMockSignals();
    
    // Invalidate the cache since new mock signals were generated
    this.signalsService.invalidateCache();
    
    return mockSignals;
  }

  @Get('/:id')
  getOneSignalById(@Param("id") id: string) {
    return this.mockSignalsService.getMockSignalById(id);
  }
}