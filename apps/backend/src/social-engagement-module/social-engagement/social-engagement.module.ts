// src/social-engagement/social-engagement.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SocialEngagementController } from './social-engagement.controller';
import { SocialEngagementService } from './social-engagement.service';
import { SocialEngagementRepository } from './social-engagement.repository';
import { SocialEngagement } from './entities/social-engagement.entity';
import { EngagementCounter } from './entities/engagement-counter.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialEngagement, EngagementCounter]),
    EventEmitterModule.forRoot(),
    SharedModule,
  ],
  controllers: [SocialEngagementController],
  providers: [SocialEngagementService, SocialEngagementRepository],
  exports: [SocialEngagementService],
})
export class SocialEngagementModule {}
