import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { NotificationPreference } from './entities/notification-preference.entity';
import { Notification } from './entities/notification.entity';
import { DeliveryRecord } from './entities/delivery-record.entity';
import { WebhookRegistration } from './entities/webhook-registration.entity';
import { NotificationPreferencesController } from './controllers/notification-preference.controller';
import { NotificationController } from './controllers/notification.controller';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { NotificationService } from './services/notification.service';
import { WebhookService } from './services/webhook.service';
import { EventNotificationService } from './services/event-notification.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationGateway } from './websocket/websocket.getway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationPreference,
      Notification,
      DeliveryRecord,
      WebhookRegistration,
    ]),
    EventEmitterModule.forRoot(),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      }),
    }),
  ],
  controllers: [
    NotificationController,
    NotificationPreferencesController,
  ],
  providers: [
    NotificationService,
    NotificationPreferenceService,
    WebhookService,
    EventNotificationService,
    NotificationQueueService,
    NotificationGateway,
  ],
  exports: [
    NotificationService,
    NotificationPreferenceService,
    WebhookService,
    EventNotificationService,
  ],
})
export class NotificationModule {}