import { Controller, Get } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { MockSignalService } from './mock-signals.service';
import { TradingSignal } from 'src/interfaces/trading-signal.interface';

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
    return this.mockSignalsService.generateMockSignals();
  }
}


