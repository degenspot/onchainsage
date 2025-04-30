// src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { DeliveryRecord } from './entities/delivery-record.entity';
import { WebhookRegistration } from './entities/webhook-registration.entity';
import { NotificationPreferenceController } from './controllers/notification-preference.controller';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { NotificationService } from './services/notification.service';
import { WebhookService } from './services/webhook.service';
import { EventNotificationService } from './services/event-notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { DeliveryTrackingService } from './services/delivery-tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationPreference,
      Notification,
      DeliveryRecord,
      WebhookRegistration,
    ]),
    EventEmitterModule.forRoot(),
    RedisModule.forRoot({
      config: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
  ],
  controllers: [NotificationPreferenceController],
  providers: [
    NotificationPreferenceService,
    NotificationService,
    WebhookService,
    EventNotificationService,
    NotificationQueueService,
    DeliveryTrackingService,
  ],
  exports: [
    NotificationPreferenceService,
    NotificationService,
    WebhookService,
    EventNotificationService,
  ],
})
export class NotificationModule {}
