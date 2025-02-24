import { Module } from '@nestjs/common';
import { TradingSignalController } from './trading-signal.controller';
import { TradingSignalService } from './provider/trading-signal.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [TradingSignalController],
  providers: [TradingSignalService]
})
export class TradingSignalModule {}
