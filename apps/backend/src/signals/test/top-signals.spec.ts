import { Test, type TestingModule } from "@nestjs/testing"
import { SignalsService } from "../signals.service"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Signal } from "../entities/signal.entity"
import { RedisService } from "../../redis/redis.service"

describe("SignalsService - Top Signals", () => {
  let service: SignalsService
  let mockSignalRepository
  let mockRedisService

  beforeEach(async () => {
    // Mock repository
    mockSignalRepository = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn().mockResolvedValue(10),
    }

    // Mock Redis service
    mockRedisService = {
      getAsync: jest.fn().mockResolvedValue(null),
      setAsync: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalsService,
        {
          provide: getRepositoryToken(Signal),
          useValue: mockSignalRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile()

    service = module.get<SignalsService>(SignalsService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("getTopSignals", () => {
    it("should return ranked signals", async () => {
      // Mock signals with different timestamps and confidence levels
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 3600000)
      const twoHoursAgo = new Date(now.getTime() - 7200000)

      const mockSignals = [
        {
          signal_id: 1,
          timestamp: oneHourAgo,
          confidence_level: "high",
          historical_performance: { success_rate: 0.9 },
        },
        {
          signal_id: 2,
          timestamp: now,
          confidence_level: "medium",
          historical_performance: { success_rate: 0.6 },
        },
        {
          signal_id: 3,
          timestamp: twoHoursAgo,
          confidence_level: "high",
          historical_performance: { success_rate: 0.8 },
        },
      ]

      mockSignalRepository.getMany.mockResolvedValue(mockSignals)

      const result = await service.getTopSignals(1, 10)

      expect(result.data.length).toBe(3)
      // The most recent medium confidence signal should be ranked higher than older high confidence
      expect(result.data[0].signal_id).toBe(2)
      expect(result.data[1].signal_id).toBe(1)
      expect(result.data[2].signal_id).toBe(3)
    })

    it("should use cached results when available", async () => {
      const cachedSignals = [
        { signal_id: 1, timestamp: new Date(), confidence_level: "high" },
        { signal_id: 2, timestamp: new Date(), confidence_level: "medium" },
      ]

      mockRedisService.getAsync.mockResolvedValue(JSON.stringify(cachedSignals))

      const result = await service.getTopSignals(1, 10)

      expect(result.data.length).toBe(2)
      expect(mockSignalRepository.createQueryBuilder).not.toHaveBeenCalled()
    })

    it("should filter signals by type", async () => {
      mockSignalRepository.getMany.mockResolvedValue([])

      await service.getTopSignals(1, 10, "price_movement")

      expect(mockSignalRepository.where).toHaveBeenCalledWith("signal.signal_type = :filter", {
        filter: "price_movement",
      })
    })
  })
})
