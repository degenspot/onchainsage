import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from '../services/notification.service';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import { NotificationChannel } from '../entities/notification.entity';

@WSGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Socket[]>();

  constructor(
    private notificationService: NotificationService,
    private preferenceService: NotificationPreferenceService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      userSockets.push(client);
      this.userSockets.set(userId, userSockets);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      let userSockets = this.userSockets.get(userId) || [];
      userSockets = userSockets.filter((socket) => socket.id !== client.id);
      if (userSockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, userSockets);
      }
    }
  }

  async sendNotification(userId: string, message: any) {
    const preferences = await this.preferenceService.getPreference(
      userId,
      message.eventType,
    );
    if (
      preferences?.enabled &&
      preferences.channels.includes(NotificationChannel.IN_APP)
    ) {
      const userSockets = this.userSockets.get(userId);
      if (userSockets?.length) {
        userSockets.forEach((socket) => socket.emit('notification', message));
      }
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, payload: { notificationId: string }) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      await this.notificationService.markAsRead(payload.notificationId, userId);
    }
  }
}
