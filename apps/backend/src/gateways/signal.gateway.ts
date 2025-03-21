import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'ws'; // Using native WebSocket instead of socket.io

@WebSocketGateway(3000, { transports: ['websocket'], cors: true }) // Runs on ws://localhost:3000
export class SignalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(SignalGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client}`);
    client.send('Welcome to the WebSocket server!');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: string): void {
    this.logger.log(`Received message: ${payload}`);
    client.send(`Echo: ${payload}`); // Echoes the message back
  }
}
