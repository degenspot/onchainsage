import { 
  WebSocketGateway as NestWebSocketGateway, 
  WebSocketServer 
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@NestWebSocketGateway()
export class WebSocketGateway {
  @WebSocketServer()
  server: Server;

  sendToUser(userId: number, payload: any) {
    this.server.to(`user_${userId}`).emit('notification', payload);
  }
}