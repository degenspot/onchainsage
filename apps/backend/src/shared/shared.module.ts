import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationModule } from '../reputation/reputation.module';
import { ReputationService } from '../reputation/reputation.service';
import { Vote } from '../reputation/entities/vote.entity';
import { ReputationAdjustment } from '../reputation/entities/reputation-adjustment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, ReputationAdjustment]), ReputationModule],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class SharedModule {} 