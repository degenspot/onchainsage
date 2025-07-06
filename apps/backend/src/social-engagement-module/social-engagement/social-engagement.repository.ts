// src/social-engagement/social-engagement.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SocialEngagement } from './entities/social-engagement.entity';
import { EngagementCounter } from './entities/engagement-counter.entity';
import { ContentPolymorph } from '../shared/interfaces/content-polymorph.interface';
import { EngagementType } from '../shared/enums/engagement-type.enum';
import { ContentType } from '../shared/enums/content-type.enum';

@Injectable()
export class SocialEngagementRepository {
  constructor(
    @InjectRepository(SocialEngagement)
    private engagementRepo: Repository<SocialEngagement>,
    @InjectRepository(EngagementCounter)
    private counterRepo: Repository<EngagementCounter>,
    private dataSource: DataSource,
  ) {}

  async findUserEngagement(
    userId: string,
    contentId: string,
    contentType: ContentType,
  ): Promise<SocialEngagement | null> {
    return this.engagementRepo.findOne({
      where: { userId, contentId, contentType },
    });
  }

  async getEngagementCounters({
    contentId,
    contentType,
  }: ContentPolymorph): Promise<EngagementCounter> {
    const counter = await this.counterRepo.findOne({
      where: { contentId, contentType },
    });

    if (counter) {
      return counter;
    }

    // Create counter if it doesn't exist
    const newCounter = this.counterRepo.create({
      contentId,
      contentType,
      likesCount: 0,
      dislikesCount: 0,
    });

    return this.counterRepo.save(newCounter);
  }

  async createOrUpdateEngagement(
    userId: string,
    contentId: string,
    contentType: ContentType,
    type: EngagementType,
    metadata?: Record<string, any>,
  ): Promise<{ engagement: SocialEngagement; counters: EngagementCounter }> {
    // We need a transaction to ensure data consistency
    return this.dataSource.transaction(async (manager) => {
      // Check if engagement exists
      const existingEngagement = await manager.findOne(SocialEngagement, {
        where: { userId, contentId, contentType },
      });

      // Get or create counter
      let counter = await manager.findOne(EngagementCounter, {
        where: { contentId, contentType },
      });

      if (!counter) {
        counter = manager.create(EngagementCounter, {
          contentId,
          contentType,
          likesCount: 0,
          dislikesCount: 0,
        });
      }

      let engagement: SocialEngagement;

      if (!existingEngagement) {
        // Create new engagement
        engagement = manager.create(SocialEngagement, {
          userId,
          contentId,
          contentType,
          type,
          metadata,
        });

        // Update counter
        if (type === EngagementType.LIKE) {
          counter.likesCount += 1;
        } else if (type === EngagementType.DISLIKE) {
          counter.dislikesCount += 1;
        }
      } else if (existingEngagement.type !== type) {
        // Toggle engagement
        engagement = existingEngagement;
        engagement.type = type;
        engagement.metadata = metadata || engagement.metadata;

        // Update counter
        if (type === EngagementType.LIKE) {
          counter.likesCount += 1;
          counter.dislikesCount -= 1;
        } else if (type === EngagementType.DISLIKE) {
          counter.likesCount -= 1;
          counter.dislikesCount += 1;
        }
      } else {
        // Remove engagement (clicking the same button again)
        if (type === EngagementType.LIKE) {
          counter.likesCount -= 1;
        } else if (type === EngagementType.DISLIKE) {
          counter.dislikesCount -= 1;
        }

        await manager.remove(existingEngagement);
        return {
          engagement: null,
          counters: await manager.save(counter),
        };
      }

      // Save both entities
      await manager.save(counter);
      return {
        engagement: await manager.save(engagement),
        counters: counter,
      };
    });
  }

  async removeEngagement(id: string): Promise<void> {
    const engagement = await this.engagementRepo.findOne({
      where: { id },
    });

    if (!engagement) {
      return;
    }

    // We need a transaction to ensure data consistency
    await this.dataSource.transaction(async (manager) => {
      // Get counter
      const counter = await manager.findOne(EngagementCounter, {
        where: {
          contentId: engagement.contentId,
          contentType: engagement.contentType,
        },
      });

      if (counter) {
        // Update counter
        if (engagement.type === EngagementType.LIKE) {
          counter.likesCount = Math.max(0, counter.likesCount - 1);
        } else if (engagement.type === EngagementType.DISLIKE) {
          counter.dislikesCount = Math.max(0, counter.dislikesCount - 1);
        }
        await manager.save(counter);
      }

      // Remove engagement
      await manager.remove(engagement);
    });
  }

  async findContentEngagements(
    contentId: string,
    contentType: ContentType,
    page = 1,
    limit = 10,
  ): Promise<[SocialEngagement[], number]> {
    return this.engagementRepo.findAndCount({
      where: { contentId, contentType },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }
}
