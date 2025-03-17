import { Module } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalsController } from './signals.controller';
import { MockSignalService } from './mock-signals.service';

@Module({
  controllers: [SignalsController],
  providers: [SignalsService, MockSignalService],
  exports: [SignalsService, MockSignalService]
})
export class SignalsModule {}
