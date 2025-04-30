// src/notification/services/notification-queue.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification, NotificationStatus, NotificationPriority } from '../entities/notification.entity';
import { DeliveryRecord, DeliveryStatus } from '../entities/delivery-record.entity';
import { EmailNotificationProvider } from '../providers/email-notification.provider';
import { PushNotificationProvider } from '../providers/push-notification.provider';
import { InAppNotificationProvider } from '../providers/in-app-notification.provider';
import { DeliveryTrackingService } from './delivery-tracking.service';

@Injectable()
export class NotificationQueueService implements OnModuleInit {
  // Queue implementation
  private queues: {
    [priority in NotificationPriority]: Notification[];
  } = {
    [NotificationPriority.URGENT]: [],
    [NotificationPriority.HIGH]: [],
    [NotificationPriority.MEDIUM]: [],
    [NotificationPriority.LOW]: [],
  };
  
  private processing = false;
  
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(DeliveryRecord)
    private deliveryRecordRepository: Repository<DeliveryRecord>,
    private eventEmitter: EventEmitter2,
    private emailProvider: EmailNotificationProvider,
    private pushProvider: PushNotificationProvider,
    private inAppProvider: InAppNotificationProvider,
    private deliveryTrackingService: DeliveryTrackingService,
  ) {}

  onModuleInit() {
    // Load pending notifications from database on startup
    this.loadPendingNotifications();
  }

  private async loadPendingNotifications(): Promise<void> {
    const pendingNotifications = await this.notificationRepository.find({
      where: { status: NotificationStatus.PENDING },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
    
    for (const notification of pendingNotifications) {
      this.queues[notification.priority].push(notification);
    }
    
    // Start processing queue if there are pending notifications
    if (pendingNotifications.length > 0) {
      this.processQueue();
    }
  }

  addToQueue(notification: Notification): void {
    this.queues[notification.priority].push(notification);
    
    // Start processing queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processRetries(): Promise<void> {
    const now = new Date();
    
    // Find delivery records that need retry
    const recordsToRetry = await this.deliveryRecordRepository.find({
      where: {
        status: DeliveryStatus.RETRY_SCHEDULED,
        nextRetryAt: LessThan(now),
      },
      relations: ['notification'],
    });
    
    for (const record of recordsToRetry) {
      // Update status to indicate we're retrying
      record.status = DeliveryStatus.SENDING;
      await this.deliveryRecordRepository.save(record);
      
      // Add the notification back to the queue for processing
      if (record.notification) {
        record.notification.status = NotificationStatus.PENDING;
        await this.notificationRepository.save(record.notification);
        this.addToQueue(record.notification);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    
    // Find expired notifications
    const expiredNotifications = await this.notificationRepository.find({
      where: {
        expiresAt: LessThan(now),
        status: NotificationStatus.PENDING,
      },
    });
    
    // Mark them as failed
    for (const notification of expiredNotifications) {
      notification.status = NotificationStatus.FAILED;
      await this.notificationRepository.save(notification);
      
      // Mark any pending delivery records as failed
      await this.deliveryRecordRepository.update(
        { notificationId: notification.id, status: DeliveryStatus.PENDING },
        { status: DeliveryStatus.FAILED, errorMessage: 'Notification expired' }
      );
      
      // Emit event
      this.eventEmitter.emit('notification.expired', notification);
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;
    
    try {
      // Process queues in priority order
      for (const priority of [
        NotificationPriority.URGENT,
        NotificationPriority.HIGH,
        NotificationPriority.MEDIUM,
        NotificationPriority.LOW,
      ]) {
        while (this.queues[priority].length > 0) {
          const notification = this.queues[priority].shift();
          
          // Process the notification
          await this.processNotification(notification);
        }
      }
    } finally {
      this.processing = false;
    }
  }
}