// src/notification/notification.module.ts
import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationController } from './controllers/notification.controller';
import { WebhookController } from './controllers/webhook.controller';
import { NotificationTemplateController } from './controllers/notification-template.controller';

import { NotificationService } from './services/notification.service';
import { WebhookService } from './services/webhook.service';
import { NotificationQueueService } from './services/notification-queue.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { DeliveryTrackingService } from './services/delivery-tracking.service';
import { NotificationListenerService } from './services/notification-listener.service';

import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { WebhookRegistration } from './entities/webhook-registration.entity';
import { DeliveryRecord } from './entities/delivery-record.entity';

import { EmailNotificationProvider } from './providers/email-notification.provider';
import { PushNotificationProvider } from './providers/push-notification.provider';
import { InAppNotificationProvider } from './providers/in-app-notification.provider';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      NotificationTemplate,
      WebhookRegistration,
      DeliveryRecord,
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    NotificationController,
    WebhookController,
    NotificationTemplateController,
  ],
  providers: [
    NotificationService,
    WebhookService,
    NotificationQueueService,
    NotificationTemplateService,
    DeliveryTrackingService,
    NotificationListenerService,
    EmailNotificationProvider,
    PushNotificationProvider,
    InAppNotificationProvider,
  ],
  exports: [
    NotificationService,
    WebhookService,
    NotificationTemplateService,
  ],
})
export class NotificationModule {}
