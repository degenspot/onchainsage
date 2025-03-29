import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signal } from '../signals/entities/signal.entity';
import { SignalTask } from './signal.task';
import { SignalGateway } from '../gateways/signal.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Signal]),
  ],
  providers: [SignalTask, SignalGateway],
})
export class TasksModule {}
