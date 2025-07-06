// src/notification/services/delivery-tracking.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DeliveryRecord,
  DeliveryStatus,
} from '../entities/delivery-record.entity';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../entities/notification.entity';

@Injectable()
export class DeliveryTrackingService {
  constructor(
    @InjectRepository(DeliveryRecord)
    private deliveryRecordRepository: Repository<DeliveryRecord>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Start tracking a delivery attempt for a notification.
   * @param notificationId The ID of the notification.
   * @param channel The notification channel (e.g., EMAIL, PUSH, IN_APP, WEBHOOK).
   * @returns The created DeliveryRecord.
   */
  async trackDeliveryStart(
    notificationId: string,
    channel: NotificationChannel,
  ): Promise<DeliveryRecord> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found`,
      );
    }

    const deliveryRecord = this.deliveryRecordRepository.create({
      notificationId,
      notification,
      channel,
      status: DeliveryStatus.PENDING,
      retryCount: 0,
    });

    return this.deliveryRecordRepository.save(deliveryRecord);
  }

  /**
   * Mark a delivery as successful.
   * @param deliveryId The ID of the DeliveryRecord.
   * @param response The response data from the delivery (e.g., API response).
   * @returns The updated DeliveryRecord.
   */
  async trackDeliverySuccess(
    deliveryId: string,
    response: any,
  ): Promise<DeliveryRecord> {
    const deliveryRecord = await this.deliveryRecordRepository.findOne({
      where: { id: deliveryId },
      relations: ['notification'],
    });

    if (!deliveryRecord) {
      throw new NotFoundException(
        `DeliveryRecord with ID ${deliveryId} not found`,
      );
    }

    deliveryRecord.status = DeliveryStatus.DELIVERED;
    deliveryRecord.deliveredAt = new Date();
    deliveryRecord.externalId = response?.id || null; // Store external ID if provided
    deliveryRecord.errorMessage = null;

    // Update notification status
    if (deliveryRecord.notification) {
      deliveryRecord.notification.status = NotificationStatus.DELIVERED;
      await this.notificationRepository.save(deliveryRecord.notification);
    }

    return this.deliveryRecordRepository.save(deliveryRecord);
  }

  /**
   * Mark a delivery as failed and schedule a retry if applicable.
   * @param deliveryId The ID of the DeliveryRecord.
   * @param errorMessage The error message from the failed delivery.
   * @returns The updated DeliveryRecord.
   */
  async trackDeliveryFailure(
    deliveryId: string,
    errorMessage: string,
  ): Promise<DeliveryRecord> {
    const deliveryRecord = await this.deliveryRecordRepository.findOne({
      where: { id: deliveryId },
      relations: ['notification'],
    });

    if (!deliveryRecord) {
      throw new NotFoundException(
        `DeliveryRecord with ID ${deliveryId} not found`,
      );
    }

    deliveryRecord.errorMessage = errorMessage;
    deliveryRecord.retryCount += 1;

    // Default retry strategy (aligned with WebhookService defaults)
    const retryStrategy = {
      maxRetries: 3,
      initialDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    };

    if (deliveryRecord.retryCount <= retryStrategy.maxRetries) {
      // Schedule retry with exponential backoff
      const delay =
        retryStrategy.initialDelay *
        Math.pow(
          retryStrategy.backoffMultiplier,
          deliveryRecord.retryCount - 1,
        );
      deliveryRecord.status = DeliveryStatus.RETRY_SCHEDULED;
      deliveryRecord.nextRetryAt = new Date(Date.now() + delay);
    } else {
      // Mark as failed if max retries exceeded
      deliveryRecord.status = DeliveryStatus.FAILED;

      // Update notification status
      if (deliveryRecord.notification) {
        deliveryRecord.notification.status = NotificationStatus.FAILED;
        await this.notificationRepository.save(deliveryRecord.notification);
      }
    }

    return this.deliveryRecordRepository.save(deliveryRecord);
  }

  /**
   * Get delivery history for a notification.
   * @param notificationId The ID of the notification.
   * @param pagination Pagination parameters.
   * @returns Paginated delivery records.
   */
  async getDeliveryHistory(
    notificationId: string,
    pagination: { page: number; limit: number } = { page: 1, limit: 10 },
  ): Promise<{
    items: DeliveryRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [items, total] = await this.deliveryRecordRepository.findAndCount({
      where: { notificationId },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }
}
