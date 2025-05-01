import { Test, TestingModule } from '@nestjs/testing';
import { EventNotificationService } from './event-notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationService } from './notification.service';
import { WebhookService } from './webhook.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Redis } from 'ioredis';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';
import { NotificationChannel } from '../entities/notification-preference.entity';

describe('EventNotificationService', () => {
  let service: EventNotificationService;
  let notificationPreferenceService: NotificationPreferenceService;
  let notificationService: NotificationService;
  let webhookService: WebhookService;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventNotificationService,
        {
          provide: NotificationPreferenceService,
          useValue: {
            getUsersToNotify: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: WebhookService,
          useValue: {
            deliverEvent: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: Redis,
          useValue: {
            lrange: jest.fn(),
            lpush: jest.fn(),
            ltrim: jest.fn(),
            expire: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventNotificationService>(EventNotificationService);
    notificationPreferenceService = module.get<NotificationPreferenceService>(
      NotificationPreferenceService,
    );
    notificationService = module.get<NotificationService>(NotificationService);
    webhookService = module.get<WebhookService>(WebhookService);
    redis = module.get<Redis>(Redis);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleOnChainEvent', () => {
    it('should process notifications for users with enabled preferences', async () => {
      const mockEvent = {
        eventType: EventType.SIGNAL_REGISTERED,
        eventData: { signalId: '123' },
        timestamp: new Date(),
      };

      const mockUsers = ['user1', 'user2'];
      const mockPreference = {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
        emailAddress: 'test@example.com',
        webhookUrl: 'https://webhook.example.com',
      };

      jest
        .spyOn(notificationPreferenceService, 'getUsersToNotify')
        .mockResolvedValue(mockUsers);
      jest
        .spyOn(service as any, 'handleEmailNotification')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'handleWebhookNotification')
        .mockResolvedValue(undefined);

      await service.handleOnChainEvent(mockEvent);

      expect(
        notificationPreferenceService.getUsersToNotify,
      ).toHaveBeenCalledWith(mockEvent.eventType);
    });

    it('should respect rate limits', async () => {
      const mockEvent = {
        eventType: EventType.SIGNAL_REGISTERED,
        eventData: { signalId: '123' },
        timestamp: new Date(),
      };

      const mockUsers = ['user1'];
      const mockPreference = {
        enabled: true,
        channels: [NotificationChannel.EMAIL],
        emailAddress: 'test@example.com',
      };

      jest
        .spyOn(notificationPreferenceService, 'getUsersToNotify')
        .mockResolvedValue(mockUsers);
      jest.spyOn(service as any, 'checkRateLimit').mockResolvedValue(false);

      await service.handleOnChainEvent(mockEvent);

      expect(notificationService.create).not.toHaveBeenCalled();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow notifications within rate limit', async () => {
      const key = 'test:key';
      const maxCount = 5;
      const windowSeconds = 60;

      jest.spyOn(redis, 'lrange').mockResolvedValue(['1', '2', '3']);
      jest.spyOn(redis, 'lpush').mockResolvedValue(1);
      jest.spyOn(redis, 'ltrim').mockResolvedValue('OK');
      jest.spyOn(redis, 'expire').mockResolvedValue(1);

      const result = await (service as any).checkRateLimit(
        key,
        maxCount,
        windowSeconds,
      );

      expect(result).toBe(true);
      expect(redis.lpush).toHaveBeenCalled();
      expect(redis.ltrim).toHaveBeenCalled();
      expect(redis.expire).toHaveBeenCalled();
    });

    it('should block notifications exceeding rate limit', async () => {
      const key = 'test:key';
      const maxCount = 5;
      const windowSeconds = 60;

      jest.spyOn(redis, 'lrange').mockResolvedValue(['1', '2', '3', '4', '5']);

      const result = await (service as any).checkRateLimit(
        key,
        maxCount,
        windowSeconds,
      );

      expect(result).toBe(false);
      expect(redis.lpush).not.toHaveBeenCalled();
    });
  });

  describe('formatEventContent', () => {
    it('should format signal registered event', () => {
      const event = {
        eventType: EventType.SIGNAL_REGISTERED,
        eventData: { signalId: '123' },
        timestamp: new Date(),
      };

      const content = (service as any).formatEventContent(event);
      expect(content).toBe('New signal registered: 123');
    });

    it('should format vote resolved event', () => {
      const event = {
        eventType: EventType.VOTE_RESOLVED,
        eventData: { voteId: '456', result: 'approved' },
        timestamp: new Date(),
      };

      const content = (service as any).formatEventContent(event);
      expect(content).toBe('Vote resolved: 456 - Result: approved');
    });
  });
});
