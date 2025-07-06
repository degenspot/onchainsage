import { Injectable } from '@nestjs/common';
import { NotificationProvider } from './notification.provider.interface';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class InAppNotificationProvider implements NotificationProvider {
  async send(notification: Notification): Promise<void> {
    // Placeholder for in-app notification logic
    console.log(`Sending in-app notification: ${notification.title}`);
  }
} 