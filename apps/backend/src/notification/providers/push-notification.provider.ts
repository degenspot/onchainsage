import { Injectable } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class PushNotificationProvider {
  async send(notification: Notification): Promise<boolean> {
    // Placeholder for push notification sending logic
    console.log(`Sending push notification: ${notification.title}`);
    return true;
  }
} 