// src/social-engagement/social-engagement.service.ts
import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocialEngagementRepository } from './social-engagement.repository';
import { CreateEngagementDto } from './dto/create-engagement.dto';
import { EngagementResponseDto } from './dto/engagement-response.dto';
import { SocialEngagement } from './entities/social-engagement.entity';
import { EngagementCounter } from './entities/engagement-counter.entity';
import { EngagementType } from '../shared/enums/engagement-type.enum';
import { RateLimiterService } from '../shared/services/rate-limiter.service';

@Injectable()
export class SocialEngagementService {
  constructor(
    private repository: SocialEngagementRepository,
    private eventEmitter: EventEmitter2,
    private rateLimiter: RateLimiterService,
  ) {}

  private mapToResponseDto(
    engagement: SocialEngagement, 
    counters: EngagementCounter
  ): EngagementResponseDto {
    if (!engagement) {
      return null;
    }

    return {
      id: engagement.id,
      userId: engagement.userId,
      contentId: engagement.contentId,
      contentType: engagement.contentType,
      type: engagement.type,
      createdAt: engagement.createdAt,
      updatedAt: engagement.updatedAt,
      counters: {
        likes: counters?.likesCount || 0,
        dislikes: counters?.dislikesCount || 0,
      },
      metadata: engagement.metadata,
    };
  }

  async createEngagement(
    userId: string, 
    dto: CreateEngagementDto
  ): Promise<EngagementResponseDto> {
    // Check rate limit
    await this.rateLimiter.checkLimit(`engagement_${userId}`, 10, 60); // 10 actions per minute

    // Create or update engagement
    const { engagement, counters } = await this.repository.createOrUpdateEngagement(
      userId,
      dto.contentId,
      dto.contentType,
      dto.type,
      dto.metadata,
    );

    // Emit event for analytics
    this.eventEmitter.emit('engagement.created', {
      userId,
      contentId: dto.contentId,
      contentType: dto.contentType,
      type: dto.type,
      timestamp: new Date(),
    });

    return this.mapToResponseDto(engagement, counters);
  }

  async removeEngagement(
    userId: string, 
    engagementId: string
  ): Promise<void> {
    const engagement = await this.repository.findUserEngagement(userId, engagementId, null);

    if (!engagement) {
      throw new NotFoundException('Engagement not found');
    }

    if (engagement.userId !== userId) {
      throw new ForbiddenException('Cannot remove another user\'s engagement');
    }

    await this.repository.removeEngagement(engagementId);

    // Emit event for analytics
    this.eventEmitter.emit('engagement.removed', {
      userId,
      contentId: engagement.contentId,
      contentType: engagement.contentType,
      type: engagement.type,
      timestamp: new Date(),
    });
  }

  async getUserEngagement(
    userId: string, 
    contentId: string, 
    contentType: string
  ): Promise<EngagementResponseDto> {
    const engagement = await this.repository.findUserEngagement(userId, contentId, contentType);
    
    if (!engagement) {
      return null;
    }

    const counters = await this.repository.getEngagementCounters({
      contentId,
      contentType,
    });

    return this.mapToResponseDto(engagement, counters);
  }

  async getContentEngagementCounts(
    contentId: string, 
    contentType: string
  ): Promise<{ likes: number; dislikes: number }> {
    const counters = await this.repository.getEngagementCounters({
      contentId,
      contentType,
    });

    return {
      likes: counters.likesCount,
      dislikes: counters.dislikesCount,
    };
  }

  async getContentEngagements(
    contentId: string,
    contentType: string,
    page = 1,
    limit = 10
  ): Promise<{ engagements: EngagementResponseDto[]; total: number }> {
    const [engagements, total] = await this.repository.findContentEngagements(
      contentId,
      contentType,
      page,
      limit
    );

    const counters = await this.repository.getEngagementCounters({
      contentId,
      contentType,
    });

    return {
      engagements: engagements.map(engagement => 
        this.mapToResponseDto(engagement, counters)
      ),
      total,
    };
  }
}