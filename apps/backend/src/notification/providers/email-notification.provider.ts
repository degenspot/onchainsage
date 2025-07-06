import { Injectable } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class EmailNotificationProvider {
  async send(notification: Notification): Promise<boolean> {
    // Placeholder for email sending logic
    console.log(`Sending email notification: ${notification.title}`);
    return true;
  }
}
