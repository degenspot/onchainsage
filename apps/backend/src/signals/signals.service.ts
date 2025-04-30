import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { Signal } from "./entities/signal.entity"
import type { RedisService } from "../redis/redis.service" // Import existing Redis service
import type { RankingOptions, WeightedSignal } from "./interfaces/ranking.interface"

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name)
  private readonly CACHE_KEY = "signals:all"
  private readonly TOP_SIGNALS_CACHE_KEY = "signals:top"
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(
    @InjectRepository(Signal)
    private readonly signalRepository: Repository<Signal>,
    private readonly redisService: RedisService,
  ) {}

  // Fetches signals ordered by timestamp (DESC) with pagination
  async findAll(ge = 1, limit = 10): Promise<{ data: Signal[]; total: number }> {
    // Try to get signals from cache first
    const cachedSignals = await this.getCachedSignals()
    const page = ge
    if (cachedSignals) {
      return {
        data: cachedSignals.slice((page - 1) * limit, page * limit),
        total: cachedSignals.length,
      }
    }

    // If not in cache, get from repository
    const [signals, total] = await this.signalRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { timestamp: "DESC" },
    })

    // Cache the signals
    await this.cacheSignals(signals)

    return {
      data: signals,
      total: total,
    }
  }

  // Get signals from Redis cache
  private async getCachedSignals(): Promise<Signal[] | null> {
    try {
      const cachedData = await this.redisService.getAsync(this.CACHE_KEY)
      if (cachedData) {
        return JSON.parse(cachedData)
      }
      return null
    } catch (error) {
      console.error("Error retrieving signals from cache:", error)
      return null
    }
  }

  // Cache signals in Redis
  private async cacheSignals(signals: Signal[]): Promise<void> {
    try {
      await this.redisService.setAsync(this.CACHE_KEY, JSON.stringify(signals), this.CACHE_TTL)
    } catch (error) {
      console.error("Error caching signals:", error)
    }
  }

  // Fetch a single signal by its ID
  async getOneSignalById(signal_id: number): Promise<Signal> {
    return this.signalRepository.findOne({ where: { signal_id } })
  }

  /**
   * Fetches top signals ranked by a combination of reputation and recency
   * @param page - Page number for pagination
   * @param limit - Number of signals per page
   * @param filter - Optional filter by signal type
   * @returns Paginated list of ranked signals
   */
  async getTopSignals(page = 1, limit = 10, filter?: string): Promise<{ data: Signal[]; total: number }> {
    try {
      // Try to get from cache first
      const cacheKey = `${this.TOP_SIGNALS_CACHE_KEY}:${filter || "all"}`
      const cachedSignals = await this.redisService.getAsync(cacheKey)

      if (cachedSignals) {
        const signals = JSON.parse(cachedSignals)
        const total = signals.length
        const startIndex = (page - 1) * limit
        const paginatedSignals = signals.slice(startIndex, startIndex + limit)

        return {
          data: paginatedSignals,
          total,
        }
      }

      // Build query with optional filter
      const queryBuilder = this.signalRepository.createQueryBuilder("signal")

      if (filter) {
        queryBuilder.where("signal.signal_type = :filter", { filter })
      }

      // Get total count for pagination
      const total = await queryBuilder.getCount()

      // Fetch signals for ranking
      const signals = await queryBuilder
        .orderBy("signal.timestamp", "DESC")
        .take(Math.min(total, 500)) // Limit to 500 most recent signals for performance
        .getMany()

      // Apply ranking algorithm
      const rankedSignals = this.rankSignals(signals)

      // Cache the ranked signals
      await this.redisService.setAsync(cacheKey, JSON.stringify(rankedSignals), this.CACHE_TTL)

      // Apply pagination to ranked results
      const startIndex = (page - 1) * limit
      const paginatedSignals = rankedSignals.slice(startIndex, startIndex + limit)

      return {
        data: paginatedSignals,
        total,
      }
    } catch (error) {
      this.logger.error(`Error fetching top signals: ${error.message}`)
      throw new Error("Failed to fetch top signals")
    }
  }

  /**
   * Ranks signals based on reputation and recency using a configurable algorithm
   * @param signals - Array of signals to rank
   * @param options - Optional configuration for the ranking algorithm
   * @returns Ranked array of signals
   */
  private rankSignals(signals: Signal[], options?: RankingOptions): Signal[] {
    const now = new Date()

    // Default options
    const config: Required<RankingOptions> = {
      decayFactor: options?.decayFactor || 0.01,
      maxAgeHours: options?.maxAgeHours || 168, // 7 days
      reputationWeight: options?.reputationWeight || 0.7,
      recencyWeight: options?.recencyWeight || 0.3,
    }

    // Calculate weight for each signal
    const weightedSignals: WeightedSignal<Signal>[] = signals.map((signal) => {
      // Calculate age in hours
      const ageInHours = (now.getTime() - signal.timestamp.getTime()) / (1000 * 60 * 60)

      // Skip signals older than maxAgeHours
      if (ageInHours > config.maxAgeHours) {
        return { signal, weight: 0 }
      }

      // Calculate recency score (1.0 for very recent, approaching 0 for older signals)
      const recencyScore = Math.exp(-config.decayFactor * ageInHours)

      // Get reputation from historical performance or confidence level
      let reputationScore = 0.5 // Default value

      if (signal.historical_performance?.success_rate) {
        reputationScore = signal.historical_performance.success_rate
      } else if (signal.confidence_level) {
        // Map confidence levels to scores
        switch (signal.confidence_level.toLowerCase()) {
          case "high":
            reputationScore = 0.9
            break
          case "medium":
            reputationScore = 0.6
            break
          case "low":
            reputationScore = 0.3
            break
        }
      }

      // Calculate combined weight
      const weight = reputationScore * config.reputationWeight + recencyScore * config.recencyWeight

      return { signal, weight }
    })

    // Sort by weight (descending)
    weightedSignals.sort((a, b) => b.weight - a.weight)

    // Return sorted signals
    return weightedSignals.map((item) => item.signal)
  }

  // Invalidate top signals cache when new signals are added
  async invalidateTopSignalsCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys(`${this.TOP_SIGNALS_CACHE_KEY}:*`)
      for (const key of keys) {
        await this.redisService.del(key)
      }
    } catch (error) {
      this.logger.error(`Error invalidating top signals cache: ${error.message}`)
    }
  }

  // Override the existing invalidateCache method to also invalidate top signals
  async invalidateCache(): Promise<void> {
    try {
      await this.redisService.del(this.CACHE_KEY)
      await this.invalidateTopSignalsCache()
    } catch (error) {
      this.logger.error(`Error invalidating signals cache: ${error.message}`)
    }
  }

  // Calculate historical performance for a signal type and confidence level
  async calculateHistoricalPerformance(signalType: string, confidenceLevel: string): Promise<any> {
    const signals = await this.signalRepository.find({
      where: {
        signal_type: signalType,
        confidence_level: confidenceLevel,
        is_verified: true, // Only consider verified signals
      },
    })

    const totalSignals = signals.length
    const successfulSignals = signals.filter((s) => s.status === "successful").length
    const failedSignals = signals.filter((s) => s.status === "failed").length
    const successRate = totalSignals > 0 ? successfulSignals / totalSignals : 0

    // Calculate average return (assuming value field represents return percentage)
    const totalReturn = signals.reduce((sum, signal) => sum + Number(signal.value), 0)
    const averageReturn = totalSignals > 0 ? totalReturn / totalSignals : 0

    return {
      success_rate: successRate,
      total_signals: totalSignals,
      successful_signals: successfulSignals,
      failed_signals: failedSignals,
      average_return: averageReturn,
      last_updated: new Date(),
    }
  }

  // Update historical performance for all signals of a given type
  async updateHistoricalPerformance(signalType: string, confidenceLevel: string): Promise<void> {
    const performance = await this.calculateHistoricalPerformance(signalType, confidenceLevel)

    await this.signalRepository.update(
      { signal_type: signalType, confidence_level: confidenceLevel },
      { historical_performance: performance },
    )
  }

  // Create a new signal with historical performance
  async createSignal(signalData: Partial<Signal>): Promise<Signal> {
    const performance = await this.calculateHistoricalPerformance(signalData.signal_type, signalData.confidence_level)

    const signal = this.signalRepository.create({
      ...signalData,
      historical_performance: performance,
    })

    return this.signalRepository.save(signal)
  }

  // Generate mock historical data for testing
  async generateMockHistoricalData(): Promise<void> {
    const mockSignals = [
      {
        signal_type: "price_movement",
        confidence_level: "high",
        value: 5.2,
        status: "successful",
        is_verified: true,
      },
      {
        signal_type: "price_movement",
        confidence_level: "high",
        value: -2.1,
        status: "failed",
        is_verified: true,
      },
      {
        signal_type: "volume_spike",
        confidence_level: "medium",
        value: 3.7,
        status: "successful",
        is_verified: true,
      },
      {
        signal_type: "social_sentiment",
        confidence_level: "high",
        value: 8.1,
        status: "successful",
        is_verified: true,
      },
      {
        signal_type: "technical_indicator",
        confidence_level: "low",
        value: 1.5,
        status: "failed",
        is_verified: true,
      },
    ]

    // Create mock signals
    for (const mockSignal of mockSignals) {
      await this.createSignal(mockSignal)
    }
  }
}
