import { Test, TestingModule } from '@nestjs/testing';
import { NotificationPreferenceService } from './notification-preference.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { EventType } from '../../../analytics/entities/smart-contract-event.entity';
import { NotificationChannel } from '../entities/notification-preference.entity';

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;
  let repository: any;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferenceService,
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationPreferenceService>(
      NotificationPreferenceService,
    );
    repository = module.get(getRepositoryToken(NotificationPreference));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const userId = 'user1';
      const mockPreferences = [
        {
          id: '1',
          userId,
          eventType: EventType.SIGNAL_REGISTERED,
          channels: [NotificationChannel.EMAIL],
          enabled: true,
        },
      ];

      repository.find.mockResolvedValue(mockPreferences);

      const result = await service.getPreferences(userId);
      expect(result).toEqual(mockPreferences);
      expect(repository.find).toHaveBeenCalledWith({ where: { userId } });
    });
  });

  describe('getPreference', () => {
    it('should return specific preference', async () => {
      const userId = 'user1';
      const eventType = EventType.SIGNAL_REGISTERED;
      const mockPreference = {
        id: '1',
        userId,
        eventType,
        channels: [NotificationChannel.EMAIL],
        enabled: true,
      };

      repository.findOne.mockResolvedValue(mockPreference);

      const result = await service.getPreference(userId, eventType);
      expect(result).toEqual(mockPreference);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId, eventType },
      });
    });

    it('should throw NotFoundException if preference not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getPreference('user1', EventType.SIGNAL_REGISTERED),
      ).rejects.toThrow(
        'Preference not found for event type signal_registered',
      );
    });
  });

  describe('updatePreference', () => {
    it('should update existing preference', async () => {
      const userId = 'user1';
      const eventType = EventType.SIGNAL_REGISTERED;
      const updateDto = {
        channels: [NotificationChannel.WEBHOOK],
        enabled: false,
      };

      const existingPreference = {
        id: '1',
        userId,
        eventType,
        channels: [NotificationChannel.EMAIL],
        enabled: true,
      };

      repository.findOne.mockResolvedValue(existingPreference);
      repository.save.mockResolvedValue({
        ...existingPreference,
        ...updateDto,
      });

      const result = await service.updatePreference(
        userId,
        eventType,
        updateDto,
      );
      expect(result).toEqual({ ...existingPreference, ...updateDto });
    });

    it('should create new preference if not exists', async () => {
      const userId = 'user1';
      const eventType = EventType.SIGNAL_REGISTERED;
      const updateDto = {
        channels: [NotificationChannel.WEBHOOK],
        enabled: true,
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({
        userId,
        eventType,
        ...updateDto,
      });
      repository.save.mockResolvedValue({
        id: '1',
        userId,
        eventType,
        ...updateDto,
      });

      const result = await service.updatePreference(
        userId,
        eventType,
        updateDto,
      );
      expect(result).toEqual({
        id: '1',
        userId,
        eventType,
        ...updateDto,
      });
    });
  });

  describe('getUsersToNotify', () => {
    it('should return user IDs with enabled preferences for event type', async () => {
      const eventType = EventType.SIGNAL_REGISTERED;
      const mockPreferences = [{ userId: 'user1' }, { userId: 'user2' }];

      repository.find.mockResolvedValue(mockPreferences);

      const result = await service.getUsersToNotify(eventType);
      expect(result).toEqual(['user1', 'user2']);
      expect(repository.find).toHaveBeenCalledWith({
        where: {
          eventType,
          enabled: true,
        },
        select: ['userId'],
      });
    });
  });
});
