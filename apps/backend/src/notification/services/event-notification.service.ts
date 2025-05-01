import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationService } from './notification.service';
import { WebhookService } from './webhook.service';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';
import {
  NotificationPreference,
  NotificationChannel,
} from '../entities/notification-preference.entity';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class EventNotificationService {
  private readonly logger = new Logger(EventNotificationService.name);
  private readonly rateLimiters = new Map<
    string,
    { lastExecution: number; currentCount: number }
  >();

  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private preferenceService: NotificationPreferenceService,
    private notificationService: NotificationService,
    private webhookService: WebhookService,
    private eventEmitter: EventEmitter2,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @OnEvent('onchain.event')
  async handleOnChainEvent(event: {
    eventType: EventType;
    eventData: any;
    timestamp: Date;
  }) {
    try {
      // Get users who want to be notified about this event
      const userIds = await this.preferenceService.getUsersToNotify(
        event.eventType,
      );

      for (const userId of userIds) {
        const preference = await this.preferenceRepository.findOne({
          where: { userId, eventType: event.eventType },
        });

        if (!preference || !preference.enabled) continue;

        // Process each enabled channel
        for (const channel of preference.channels) {
          if (
            channel === NotificationChannel.EMAIL &&
            preference.emailAddress
          ) {
            await this.handleEmailNotification(userId, preference, event);
          } else if (
            channel === NotificationChannel.WEBHOOK &&
            preference.webhookUrl
          ) {
            await this.handleWebhookNotification(userId, preference, event);
          } else if (channel === NotificationChannel.IN_APP) {
            await this.handleInAppNotification(userId, preference, event);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error handling on-chain event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleEmailNotification(
    userId: string,
    preference: NotificationPreference,
    event: { eventType: EventType; eventData: any; timestamp: Date },
  ) {
    const rateLimitKey = `email:${userId}:${event.eventType}`;
    if (!(await this.checkRateLimit(rateLimitKey, 10, 3600))) {
      // 10 per hour
      this.logger.warn(
        `Email rate limit exceeded for user ${userId} and event ${event.eventType}`,
      );
      return;
    }

    const title = `On-chain Event: ${event.eventType}`;
    const content = this.formatEventContent(event);

    await this.notificationService.create({
      userId,
      title,
      content,
      channels: [NotificationChannel.EMAIL],
      metadata: {
        eventType: event.eventType,
        eventData: event.eventData,
      },
    });
  }

  private async handleWebhookNotification(
    userId: string,
    preference: NotificationPreference,
    event: { eventType: EventType; eventData: any; timestamp: Date },
  ) {
    const rateLimitKey = `webhook:${userId}:${event.eventType}`;
    if (!(await this.checkRateLimit(rateLimitKey, 5, 60))) {
      // 5 per minute
      this.logger.warn(
        `Webhook rate limit exceeded for user ${userId} and event ${event.eventType}`,
      );
      return;
    }

    const payload = {
      event: event.eventType,
      data: event.eventData,
      timestamp: event.timestamp,
    };

    await this.webhookService.deliverEvent(
      preference.webhookUrl,
      event.eventType,
      payload,
      preference.webhookConfig,
    );
  }

  private async handleInAppNotification(
    userId: string,
    preference: NotificationPreference,
    event: { eventType: EventType; eventData: any; timestamp: Date },
  ) {
    const title = `On-chain Event: ${event.eventType}`;
    const content = this.formatEventContent(event);

    await this.notificationService.create({
      userId,
      title,
      content,
      channels: [NotificationChannel.IN_APP],
      metadata: {
        eventType: event.eventType,
        eventData: event.eventData,
      },
    });
  }

  private async checkRateLimit(
    key: string,
    maxCount: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const currentTime = Math.floor(Date.now() / 1000);
    const windowStart = currentTime - windowSeconds;

    // Get all timestamps within the window
    const timestamps = await this.redis.lrange(key, 0, -1);
    const validTimestamps = timestamps
      .map(Number)
      .filter((timestamp) => timestamp > windowStart);

    // If we're at the limit, return false
    if (validTimestamps.length >= maxCount) {
      return false;
    }

    // Add current timestamp and trim old ones
    await this.redis.lpush(key, currentTime);
    await this.redis.ltrim(key, 0, maxCount - 1);
    await this.redis.expire(key, windowSeconds);

    return true;
  }

  private formatEventContent(event: {
    eventType: EventType;
    eventData: any;
    timestamp: Date;
  }): string {
    switch (event.eventType) {
      case EventType.SIGNAL_REGISTERED:
        return `New signal registered: ${event.eventData.signalId}`;
      case EventType.VOTE_RESOLVED:
        return `Vote resolved: ${event.eventData.voteId} - Result: ${event.eventData.result}`;
      case EventType.REPUTATION_CHANGED:
        return `Reputation changed: ${event.eventData.userId} - New value: ${event.eventData.newValue}`;
      case EventType.STAKE:
        return `Stake added: ${event.eventData.amount}`;
      case EventType.UNSTAKE:
        return `Stake removed: ${event.eventData.amount}`;
      case EventType.REWARD_CLAIMED:
        return `Reward claimed: ${event.eventData.amount}`;
      case EventType.SIGNAL_EXPIRED:
        return `Signal expired: ${event.eventData.signalId}`;
      case EventType.SIGNAL_FLAGGED:
        return `Signal flagged: ${event.eventData.signalId} - Reason: ${event.eventData.reason}`;
      default:
        return `Event occurred: ${event.eventType}`;
    }
  }
}
