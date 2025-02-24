import { Controller, Get } from '@nestjs/common';
import { TradingSignalService } from './provider/trading-signal.service';

@Controller('trading-signals')
export class TradingSignalController {
  constructor(private readonly tradingSignalService: TradingSignalService) {}

  @Get()
  async getTradingSignals() {
    return await this.tradingSignalService.generateTradingSignals();
  }
}
