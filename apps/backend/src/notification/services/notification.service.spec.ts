import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationQueueService } from './notification-queue.service';

@Injectable()
class MockTemplateService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async renderTemplate(_template: any, _data: any) {
    return {
      title: 'Rendered Title',
      content: 'Rendered Content',
    };
  }
}

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: any;
  let templateRepository: any;
  let queueService: any;
  let templateService: any;

  beforeEach(async () => {
    const mockNotificationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockTemplateRepository = {
      findOne: jest.fn(),
    };

    const mockQueueService = {
      addToQueue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(NotificationTemplate),
          useValue: mockTemplateRepository,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: NotificationQueueService,
          useValue: mockQueueService,
        },
        {
          provide: MockTemplateService,
          useClass: MockTemplateService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    templateRepository = module.get(getRepositoryToken(NotificationTemplate));
    queueService = module.get(NotificationQueueService);
    templateService = module.get(MockTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createDto = {
        userId: 'user1',
        title: 'Test',
        content: 'Test notification',
      };

      const mockNotification = {
        id: '1',
        ...createDto,
      };

      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(queueService.addToQueue).toHaveBeenCalledWith(mockNotification);
    });

    it('should create a notification with template', async () => {
      const createDto = {
        userId: 'user1',
        content: 'Fallback content',
        templateId: 'template1',
        templateData: { key: 'value' },
      };

      const mockTemplate = {
        id: 'template1',
        active: true,
      };

      const mockRenderedContent = {
        title: 'Rendered Title',
        content: 'Rendered Content',
      };

      templateRepository.findOne.mockResolvedValue(mockTemplate);
      templateService.renderTemplate.mockResolvedValue(mockRenderedContent);

      const mockNotification = {
        id: '1',
        userId: createDto.userId,
        ...mockRenderedContent,
        template: { id: mockTemplate.id },
      };

      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(templateService.renderTemplate).toHaveBeenCalledWith(
        mockTemplate,
        createDto.templateData,
      );
      expect(queueService.addToQueue).toHaveBeenCalledWith(mockNotification);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [
        { id: '1', content: 'Test 1' },
        { id: '2', content: 'Test 2' },
      ];

      notificationRepository.findAndCount.mockResolvedValue([
        mockNotifications,
        2,
      ]);

      const result = await service.findAll('user1', { page: 1, limit: 10 });

      expect(result).toEqual({
        items: mockNotifications,
        total: 2,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findUnread', () => {
    it('should return unread notifications', async () => {
      const mockNotifications = [{ id: '1', content: 'Test 1', read: false }];

      notificationRepository.findAndCount.mockResolvedValue([
        mockNotifications,
        1,
      ]);

      const result = await service.findUnread('user1', { page: 1, limit: 10 });

      expect(result).toEqual({
        items: mockNotifications,
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: '1',
        content: 'Test',
        read: false,
      };

      notificationRepository.findOne.mockResolvedValue(mockNotification);
      notificationRepository.save.mockImplementation(
        (notification) => notification,
      );

      const result = await service.markAsRead('1', 'user1');

      expect(result.read).toBe(true);
    });
  });
});
