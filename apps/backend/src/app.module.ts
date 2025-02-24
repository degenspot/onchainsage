import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SignalsModule } from './signals/signals.module';
import { TradingSignalModule } from './trading-signal/trading-signal.module';

@Module({
  imports: [AuthModule, HealthModule, SignalsModule, TradingSignalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
