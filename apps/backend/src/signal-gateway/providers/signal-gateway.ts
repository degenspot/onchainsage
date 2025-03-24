import { WebSocketGateway, WebSocketServer, OnGatewayInit } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MockSignalService } from "src/signals/mock-signals.service";

@WebSocketGateway({ cors: true })
export class SignalGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly mockSignalService: MockSignalService) {}

  /**
   * Handles a new client connection.
   * @param client The connected client socket.
   */
  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

   /**
   * Handles client disconnection.
   * @param client The disconnected client socket.
   */
   async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  afterInit() {
    console.log("WebSocket Server Initialized");
    this.startSignalBroadcast();
  }

  startSignalBroadcast() {
    setInterval(() => {
      const newSignal = this.mockSignalService.generateSingleSignal();
      this.server.emit("signalUpdate", newSignal);
      console.log("Broadcasted new signal:", newSignal);
    }, 30000); // Every 30 seconds
  }
}