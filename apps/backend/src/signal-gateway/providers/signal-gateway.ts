import { WebSocketGateway, WebSocketServer, OnGatewayInit, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { MockSignalService } from "src/signals/mock-signals.service";

@WebSocketGateway({ cors: true })
export class SignalGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly mockSignalService: MockSignalService) {}

  /**
   * Handles a new client connection.
   * @param client The connected client socket.
   */
  async handleConnection(client: Socket) {
    try {
      console.log(`Client connected: ${client.id}`);

      // Emit an initial signal when a client connects
      const newSignal = this.mockSignalService.generateSingleSignal();
      if (this.server) {
        client.emit("signalUpdate", newSignal);
      }
    } catch (error) {
      console.error(`Error handling connection for client ${client.id}:`, error);
    }
  }

  /**
   * Handles client disconnection.
   * @param client The disconnected client socket.
   */
  async handleDisconnect(client: Socket) {
    try {
      console.log(`Client disconnected: ${client.id}`);
    } catch (error) {
      console.error(`Error handling disconnection for client ${client.id}:`, error);
    }
  }

  afterInit() {
    try {
      console.log("WebSocket Server Initialized");
      this.startSignalBroadcast();
    } catch (error) {
      console.error("Error initializing WebSocket server:", error);
    }
  }

  startSignalBroadcast() {
    try {
      setInterval(() => {
        try {
          const newSignal = this.mockSignalService.generateSingleSignal();
          if (this.server) {
            this.server.emit("signalUpdate", newSignal);
            // console.log("Broadcasted new signal:", newSignal);
          } else {
            console.warn("WebSocket server is undefined. Unable to broadcast signal.");
          }
        } catch (error) {
          console.error("Error broadcasting signal:", error);
        }
      }, 30000); // Every 30 seconds
    } catch (error) {
      console.error("Error starting signal broadcast:", error);
    }
  }

  @SubscribeMessage("signals")
  handleSignalUpdate() {
    try {
      const newSignal = this.mockSignalService.generateSingleSignal();
      return newSignal;
    } catch (error) {
      console.error("Error handling signal update:", error);
    }
  }
}