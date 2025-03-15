import { Module } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalsController } from './signals.controller';

@Module({
  controllers: [SignalsController],
  providers: [SignalsService],
  exports: [SignalsService]
})
export class SignalsModule {}
