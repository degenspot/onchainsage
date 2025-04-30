// src/social-engagement/social-engagement.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocialEngagementService } from './social-engagement.service';
import { SocialEngagementRepository } from './social-engagement.repository';
import { RateLimiterService } from '../shared/services/rate-limiter.service';
import { CreateEngagementDto } from './dto/create-engagement.dto';
import { EngagementType } from '../shared/enums/engagement-type.enum';
import { ContentType } from '../shared/enums/content-type.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SocialEngagementService', () => {
  let service: SocialEngagementService;
  let repository: SocialEngagementRepository;
  let eventEmitter: EventEmitter2;
  let rateLimiter: RateLimiterService;

  const mockRepository = {
    findUserEngagement: jest.fn(),
    getEngagementCounters: jest.fn(),
    createOrUpdateEngagement: jest.fn(),
    removeEngagement: jest.fn(),
    findContentEngagements: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockRateLimiter = {
    checkLimit: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialEngagementService,
        {
          provide: SocialEngagementRepository,
          useValue: mockRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: RateLimiterService,
          useValue: mockRateLimiter,
        },
      ],
    }).compile();

    service = module.get<SocialEngagementService>(SocialEngagementService);
    repository = module.get<SocialEngagementRepository>(SocialEngagementRepository);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    rateLimiter = module.get<RateLimiterService>(RateLimiterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEngagement', () => {
    it('should create a new engagement', async () => {
      const userId = 'user-123';
      const dto: CreateEngagementDto = {
        contentId: 'content-123',
        contentType: ContentType.TRADING_SIGNAL,
        type: EngagementType.LIKE,
      };

      const mockEngagement = {
        id: 'engagement-123',
        userId,
        contentId: dto.contentId,
        contentType: dto.contentType,
        type: dto.type,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      };

      const mockCounters = {
        id: 'counter-123',
        contentId: dto.contentId,
        contentType: dto.contentType,
        likesCount: 1,
        dislikesCount: 0,
        updatedAt: new Date(),
      };

      mockRepository.createOrUpdateEngagement.mockResolvedValue({
        engagement: mockEngagement,
        counters: mockCounters,
      });

      const result = await service.createEngagement(userId, dto);

      expect(rateLimiter.checkLimit).toHaveBeenCalledWith(`engagement_${userId}`, 10, 60);
      expect(mockRepository.createOrUpdateEngagement).toHaveBeenCalledWith(
        userId,
        dto.contentId,
        dto.contentType,
        dto.type,
        dto.metadata,
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'engagement.created',
        expect.objectContaining({
          userId,
          contentId: dto.contentId,
          contentType: dto.contentType,
          type: dto.type,
        }),
      );
      expect(result).toEqual({
        id: mockEngagement.id,
        userId: mockEngagement.userId,
        contentId: mockEngagement.contentId,
        contentType: mockEngagement.contentType,
        type: mockEngagement.type,
        createdAt: mockEngagement.createdAt,
        updatedAt: mockEngagement.updatedAt,
        counters: {
          likes: mockCounters.likesCount,
          dislikes: mockCounters.dislikesCount,
        },
        metadata: mockEngagement.metadata,
      });
    });

    it('should return null when engagement is removed (toggle off)', async () => {
      const userId = 'user-123';
      const dto: CreateEngagementDto = {
        contentId: 'content-123',
        contentType: ContentType.TRADING_SIGNAL,
        type: EngagementType.LIKE,
      };

      const mockCounters = {
        id: 'counter-123',
        contentId: dto.contentId,
        contentType: dto.contentType,
        likesCount: 0,
        dislikesCount: 0,
        updatedAt: new Date(),
      };

      mockRepository.createOrUpdateEngagement.mockResolvedValue({
        engagement: null,
        counters: mockCounters,
      });

      const result = await service.createEngagement(userId, dto);

      expect(result).toBeNull();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'engagement.created',
        expect.any(Object),
      );
    });
  });

  describe('removeEngagement', () => {
    it('should remove an engagement', async () => {
      const userId = 'user-123';
      const engagementId = 'engagement-123';
      const mockEngagement = {
        id: engagementId,
        userId,
        contentId: 'content-123',
        contentType: ContentType.TRADING_SIGNAL,
        type: EngagementType.LIKE,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      };

      mockRepository.findUserEngagement.mockResolvedValue(mockEngagement);

      await service.removeEngagement(userId, engagementId);

      expect(mockRepository.findUserEngagement).toHaveBeenCalledWith(userId, engagementId, null);
      expect(mockRepository.removeEngagement).toHaveBeenCalledWith(engagementId);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'engagement.removed',
        expect.objectContaining({
          userId,
          contentId: mockEngagement.contentId,
          contentType: mockEngagement.contentType,
          type: mockEngagement.type,
        }),
      );
    });

    it('should throw NotFoundException when engagement not found', async () => {
      const userId = 'user-123';
      const engagementId = 'non-existent-id';

      mockRepository.findUserEngagement.mockResolvedValue(null);

      await expect(service.removeEngagement(userId, engagementId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.removeEngagement).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user tries to remove another user engagement', async () => {
      const userId = 'user-123';
      const otherUserId = 'user-456';
      const engagementId = 'engagement-123';
      const mockEngagement = {
        id: engagementId,
        userId: otherUserId, // Different user
        contentId: 'content-123',
        contentType: ContentType.TRADING_SIGNAL,
        type: EngagementType.LIKE,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      };

      mockRepository.findUserEngagement.mockResolvedValue(mockEngagement);

      await expect(service.removeEngagement(userId, engagementId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRepository.removeEngagement).not.toHaveBeenCalled();
    });
  });

  describe('getUserEngagement', () => {
    it('should return user engagement for specific content', async () => {
      const userId = 'user-123';
      const contentId = 'content-123';
      const contentType = ContentType.TRADING_SIGNAL;
      
      const mockEngagement = {
        id: 'engagement-123',
        userId,
        contentId,
        contentType,
        type: EngagementType.LIKE,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
      };

      const mockCounters = {
        id: 'counter-123',
        contentId,
        contentType,
        likesCount: 5,
        dislikesCount: 2,
        updatedAt: new Date(),
      };

      mockRepository.findUserEngagement.mockResolvedValue(mockEngagement);
      mockRepository.getEngagementCounters.mockResolvedValue(mockCounters);

      const result = await service.getUserEngagement(userId, contentId, contentType);

      expect(mockRepository.findUserEngagement).toHaveBeenCalledWith(userId, contentId, contentType);
      expect(mockRepository.getEngagementCounters).toHaveBeenCalledWith({
        contentId,
        contentType,
      });
      
      expect(result).toEqual({
        id: mockEngagement.id,
        userId: mockEngagement.userId,
        contentId: mockEngagement.contentId,
        contentType: mockEngagement.contentType,
        type: mockEngagement.type,
        createdAt: mockEngagement.createdAt,
        updatedAt: mockEngagement.updatedAt,
        counters: {
          likes: mockCounters.likesCount,
          dislikes: mockCounters.dislikesCount,
        },
        metadata: mockEngagement.metadata,
      });
    });

    it('should return null when user has no engagement for content', async () => {
      const userId = 'user-123';
      const contentId = 'content-123';
      const contentType = ContentType.TRADING_SIGNAL;

      mockRepository.findUserEngagement.mockResolvedValue(null);

      const result = await service.getUserEngagement(userId, contentId, contentType);

      expect(result).toBeNull();
      expect(mockRepository.getEngagementCounters).not.toHaveBeenCalled();
    });
  });

  describe('getContentEngagementCounts', () => {
    it('should return engagement counts for content', async () => {
      const contentId = 'content-123';
      const contentType = ContentType.TRADING_SIGNAL;
      
      const mockCounters = {
        id: 'counter-123',
        contentId,
        contentType,
        likesCount: 10,
        dislikesCount: 3,
        updatedAt: new Date(),
      };

      mockRepository.getEngagementCounters.mockResolvedValue(mockCounters);

      const result = await service.getContentEngagementCounts(contentId, contentType);

      expect(mockRepository.getEngagementCounters).toHaveBeenCalledWith({
        contentId,
        contentType,
      });
      expect(result).toEqual({
        likes: mockCounters.likesCount,
        dislikes: mockCounters.dislikesCount,
      });
    });
  });

  describe('getContentEngagements', () => {
    it('should return paginated engagements for content', async () => {
      const contentId = 'content-123';
      const contentType = ContentType.TRADING_SIGNAL;
      const page = 1;
      const limit = 10;
      
      const mockEngagements = [
        {
          id: 'engagement-123',
          userId: 'user-123',
          contentId,
          contentType,
          type: EngagementType.LIKE,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
        {
          id: 'engagement-456',
          userId: 'user-456',
          contentId,
          contentType,
          type: EngagementType.DISLIKE,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {},
        },
      ];

      const mockCounters = {
        id: 'counter-123',
        contentId,
        contentType,
        likesCount: 15,
        dislikesCount: 7,
        updatedAt: new Date(),
      };

      mockRepository.findContentEngagements.mockResolvedValue([mockEngagements, 2]);
      mockRepository.getEngagementCounters.mockResolvedValue(mockCounters);

      const result = await service.getContentEngagements(contentId, contentType, page, limit);

      expect(mockRepository.findContentEngagements).toHaveBeenCalledWith(
        contentId,
        contentType,
        page,
        limit
      );
      expect(mockRepository.getEngagementCounters).toHaveBeenCalledWith({
        contentId,
        contentType,
      });
      
      expect(result).toEqual({
        engagements: mockEngagements.map(engagement => ({
          id: engagement.id,
          userId: engagement.userId,
          contentId: engagement.contentId,
          contentType: engagement.contentType,
          type: engagement.type,
          createdAt: engagement.createdAt,
          updatedAt: engagement.updatedAt,
          counters: {
            likes: mockCounters.likesCount,
            dislikes: mockCounters.dislikesCount,
          },
          metadata: engagement.metadata,
        })),
        total: 2,
      });
    });
  });
});