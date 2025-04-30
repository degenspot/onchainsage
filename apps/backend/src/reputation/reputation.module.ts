import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from './entities/vote.entity';
import { ReputationAdjustment } from './entities/reputation-adjustment.entity';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, ReputationAdjustment])],
  providers: [ReputationService],
  controllers: [ReputationController],
})
export class ReputationModule {}
