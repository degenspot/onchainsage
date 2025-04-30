import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { DeliveryRecord } from '../entities/delivery-record.entity';
import { DeliveryStatus } from '../entities/delivery-record.entity';
import { NotificationChannel } from '../entities/notification-preference.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: any;
  let deliveryRecordRepository: any;

  beforeEach(async () => {
    const mockNotificationRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockDeliveryRecordRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(DeliveryRecord),
          useValue: mockDeliveryRecordRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    deliveryRecordRepository = module.get(getRepositoryToken(DeliveryRecord));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification and delivery records', async () => {
      const createDto = {
        userId: 'user1',
        content: 'Test notification',
        channels: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
      };

      const mockNotification = {
        id: '1',
        ...createDto,
      };

      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);
      deliveryRecordRepository.create.mockImplementation((record) => record);
      deliveryRecordRepository.save.mockResolvedValue({ id: '1' });

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(deliveryRecordRepository.create).toHaveBeenCalledTimes(2);
      expect(deliveryRecordRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryFailedDeliveries', () => {
    it('should retry failed deliveries', async () => {
      const notificationId = '1';
      const mockRecords = [
        {
          id: '1',
          channel: NotificationChannel.EMAIL,
          status: DeliveryStatus.FAILED,
        },
      ];

      deliveryRecordRepository.find.mockResolvedValue(mockRecords);
      deliveryRecordRepository.save.mockResolvedValue({ id: '1' });

      await service.retryFailedDeliveries(notificationId);

      expect(deliveryRecordRepository.save).toHaveBeenCalledWith({
        ...mockRecords[0],
        status: DeliveryStatus.PENDING,
        retryCount: 1,
      });
    });

    it('should not retry if max retries reached', async () => {
      const notificationId = '1';
      const mockRecords = [
        {
          id: '1',
          channel: NotificationChannel.EMAIL,
          status: DeliveryStatus.FAILED,
          retryCount: 3,
        },
      ];

      deliveryRecordRepository.find.mockResolvedValue(mockRecords);

      await service.retryFailedDeliveries(notificationId);

      expect(deliveryRecordRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateDeliveryStatus', () => {
    it('should update delivery status', async () => {
      const recordId = '1';
      const status = DeliveryStatus.SUCCESS;
      const error = null;

      deliveryRecordRepository.findOne.mockResolvedValue({ id: recordId });
      deliveryRecordRepository.save.mockResolvedValue({ id: recordId, status });

      await service.updateDeliveryStatus(recordId, status, error);

      expect(deliveryRecordRepository.save).toHaveBeenCalledWith({
        id: recordId,
        status,
        error,
      });
    });

    it('should throw error if record not found', async () => {
      deliveryRecordRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateDeliveryStatus('1', DeliveryStatus.SUCCESS),
      ).rejects.toThrow('Delivery record not found');
    });
  });
});
