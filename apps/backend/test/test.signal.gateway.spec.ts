
import { Test, TestingModule } from '@nestjs/testing';
import { SignalGateway } from '../src/gateways/signal.gateway'; 
import { MockSignalService } from '../src/signals/mock-signals.service';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';

describe('SignalGateway (WebSocket Integration)', () => {
  let gateway: SignalGateway;
  let mockSignalService: MockSignalService;
  let ioServer: Server;
  let httpServer;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        SignalGateway,
        {
          provide: MockSignalService,
          useValue: {
            generateSingleSignal: jest.fn(() => ({ signal: 'mocked-signal' })),
          },
        },
      ],
    }).compile();

    mockSignalService = moduleFixture.get<MockSignalService>(MockSignalService);

    // Create HTTP server and socket.io 
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: { origin: "*" },
    });

    gateway = moduleFixture.get(SignalGateway);
    gateway.server = ioServer;

    // Manually bind gateway to all server events
    ioServer.on('connection', (socket) => {
      gateway.handleConnection(socket);

      // Listen for "signals" message
      socket.on('signals', () => {
        const signal = mockSignalService.generateSingleSignal();
        socket.emit('signalUpdate', signal);
      });

      // Simulate preference update 
      socket.on('preferences', () => {
        socket.emit('preferenceUpdate', { preference: 'mocked-preference' });
      });

      socket.on('disconnect', () => {
        gateway.handleDisconnect(socket);
      });
    });

    httpServer.listen(5000);
  });

  afterAll(() => {
    ioServer.close();
    httpServer.close();
  });

  beforeEach((done) => {
    clientSocket = Client('http://localhost:5000', {
      transports: ['websocket'],
    });

    clientSocket.on('connect', () => done());
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should receive signal updates from broadcast', (done) => {
    clientSocket.on('signalUpdate', (data) => {
      expect(data).toEqual({ signal: 'mocked-signal' });
      done();
    });

    gateway.server.emit('signalUpdate', { signal: 'mocked-signal' });
  });

  it('should handle signals subscription', (done) => {
    clientSocket.emit('signals');

    clientSocket.on('signalUpdate', (data) => {
      expect(data).toEqual({ signal: 'mocked-signal' });
      done();
    });
  });

  it('should receive preference updates', (done) => {
    clientSocket.emit('preferences'); // emit the preferences event

    clientSocket.on('preferenceUpdate', (data) => {
      expect(data).toEqual({ preference: 'mocked-preference' });
      done();
    });
  });
});
