import { Notification } from '../entities/notification.entity';

export interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}
