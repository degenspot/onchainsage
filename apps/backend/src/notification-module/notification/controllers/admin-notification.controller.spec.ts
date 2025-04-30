import { Test, TestingModule } from '@nestjs/testing';
import { AdminNotificationController } from './admin-notification.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeliveryRecord } from '../entities/delivery-record.entity';
import { Notification } from '../entities/notification.entity';
import { DeliveryStatus } from '../entities/delivery-record.entity';

describe('AdminNotificationController', () => {
  let controller: AdminNotificationController;
  let deliveryRecordRepository: any;
  let notificationRepository: any;

  beforeEach(async () => {
    const mockDeliveryRecordRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      find: jest.fn(),
    };

    const mockNotificationRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminNotificationController],
      providers: [
        {
          provide: getRepositoryToken(DeliveryRecord),
          useValue: mockDeliveryRecordRepository,
        },
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    controller = module.get<AdminNotificationController>(
      AdminNotificationController,
    );
    deliveryRecordRepository = module.get(getRepositoryToken(DeliveryRecord));
    notificationRepository = module.get(getRepositoryToken(Notification));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFailedNotifications', () => {
    it('should return paginated failed notifications', async () => {
      const mockRecords = [
        {
          id: '1',
          status: DeliveryStatus.FAILED,
          notification: { id: '1', content: 'Test notification' },
        },
      ];

      deliveryRecordRepository.getManyAndCount.mockResolvedValue([
        mockRecords,
        1,
      ]);

      const result = await controller.getFailedNotifications(1, 10);

      expect(result).toEqual({
        items: mockRecords,
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should filter by status and channel', async () => {
      const mockRecords = [
        {
          id: '1',
          status: DeliveryStatus.FAILED,
          channel: 'email',
          notification: { id: '1', content: 'Test notification' },
        },
      ];

      deliveryRecordRepository.getManyAndCount.mockResolvedValue([
        mockRecords,
        1,
      ]);

      await controller.getFailedNotifications(
        1,
        10,
        DeliveryStatus.FAILED,
        'email',
      );

      expect(deliveryRecordRepository.andWhere).toHaveBeenCalledWith(
        'record.channel = :channel',
        { channel: 'email' },
      );
    });
  });

  describe('retryFailedNotifications', () => {
    it('should retry failed notifications', async () => {
      const mockRecords = [
        {
          id: '1',
          notification: { id: '1', status: 'failed' },
        },
      ];

      deliveryRecordRepository.find.mockResolvedValue(mockRecords);

      const result = await controller.retryFailedNotifications({ ids: ['1'] });

      expect(result).toEqual({ message: 'Notifications queued for retry' });
      expect(notificationRepository.save).toHaveBeenCalledWith({
        id: '1',
        status: 'pending',
      });
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const mockStats = [
        { channel: 'email', status: 'success', count: '5' },
        { channel: 'webhook', status: 'failed', count: '2' },
      ];

      deliveryRecordRepository.getRawMany.mockResolvedValue(mockStats);

      const result = await controller.getNotificationStats();

      expect(result).toEqual(mockStats);
    });

    it('should filter by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      await controller.getNotificationStats(startDate, endDate);

      expect(deliveryRecordRepository.andWhere).toHaveBeenCalledWith(
        'record.createdAt >= :startDate',
        { startDate: new Date(startDate) },
      );
      expect(deliveryRecordRepository.andWhere).toHaveBeenCalledWith(
        'record.createdAt <= :endDate',
        { endDate: new Date(endDate) },
      );
    });
  });
});
