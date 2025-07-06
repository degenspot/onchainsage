import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalsService } from './signals.service';
import { SignalsController } from './signals.controller';
import { MockSignalService } from './mock-signals.service';
import { Signal } from './entities/signal.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Signal]), RedisModule],
  controllers: [SignalsController],
  providers: [SignalsService, MockSignalService],
  exports: [SignalsService, MockSignalService],
})
export class SignalsModule {}
