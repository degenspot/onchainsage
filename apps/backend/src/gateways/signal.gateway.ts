import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';  // Change to socket.io

@WebSocketGateway({ cors: true })
export class SignalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(SignalGateway.name);
  private clients: Set<any> = new Set();

  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    this.clients.add(client);
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('message', 'Welcome to the WebSocket server!');
  }

  handleDisconnect(client: any) {
    this.clients.delete(client);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastNewSignal(signal: any): void {
    this.logger.log(`Broadcasting new signal to ${this.clients.size} clients`);
    this.server.emit('new_signal', signal);
  }

  @SubscribeMessage('preferences')
  handlePreferences(client: any, preferences: any): void {
    this.logger.log(`Received updated preferences from ${client.id}: ${JSON.stringify(preferences)}`);
    // Handle preferences update
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
