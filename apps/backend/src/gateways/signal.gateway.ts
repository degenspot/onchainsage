import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'ws'; // Using native WebSocket instead of socket.io
import { logger } from '../utils/winstonLogger'; 

@WebSocketGateway(3000, { transports: ['websocket'], cors: true }) // Runs on ws://localhost:3000
export class SignalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    logger.info({ message: 'Client connected', client: client.url });
    client.send('Welcome to the WebSocket server!');
  }

  handleDisconnect(client: Socket) {
    logger.info({ message: 'Client disconnected', client: client.url });
  }

  @SubscribeMessage('preferences')
  handlePreferences(client: Socket, preferences: any): void {
    logger.info({ message: 'Received preferences', preferences });

    // Broadcast updated preferences to all connected clients
    this.server.clients.forEach((connectedClient: Socket) => {
      if (connectedClient.readyState === connectedClient.OPEN) {
        connectedClient.send(JSON.stringify({ event: 'preferenceUpdate', data: preferences }));
      }
    });
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: string): void {
    logger.info({ message: 'Received message', payload });
    client.send(`Echo: ${payload}`); // Echoes the message back
  }
}
