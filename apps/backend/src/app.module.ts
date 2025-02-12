import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { SignalsModule } from './signals/signals.module';

@Module({
  imports: [AuthModule, HealthModule, SignalsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
