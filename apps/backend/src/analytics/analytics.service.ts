import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { type Repository, Between, LessThanOrEqual } from "typeorm"
import { Cron, CronExpression } from "@nestjs/schedule"
import { SmartContractEvent, EventType } from "./entities/smart-contract-event.entity"
import { DailyAnalytics } from "./entities/daily-analytics.entity"
import { AnalyticsSummary } from "./entities/analytics-summary.entity"
import { ethers } from "ethers"

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SmartContractEvent)
    private readonly eventRepository: Repository<SmartContractEvent>,
    @InjectRepository(DailyAnalytics)
    private readonly dailyAnalyticsRepository: Repository<DailyAnalytics>,
    @InjectRepository(AnalyticsSummary)
    private readonly analyticsSummaryRepository: Repository<AnalyticsSummary>,
  ) {}

  /**
   * Get analytics summary
   */
  async getSummary(): Promise<AnalyticsSummary> {
    try {
      const summary = await this.analyticsSummaryRepository.findOne({
        order: { updatedAt: "DESC" },
      })

      if (!summary) {
        // If no summary exists, generate one
        await this.updateAnalyticsSummary()
        return this.analyticsSummaryRepository.findOne({
          order: { updatedAt: "DESC" },
        })
      }

      return summary
    } catch (error) {
      this.logger.error(`Error getting analytics summary: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Get daily analytics for a date range
   * @param startDate Start date for the range
   * @param endDate End date for the range
   */
  async getDailyAnalytics(startDate: Date, endDate: Date): Promise<DailyAnalytics[]> {
    try {
      return this.dailyAnalyticsRepository.find({
        where: {
          date: Between(startDate, endDate),
        },
        order: {
          date: "ASC",
        },
      })
    } catch (error) {
      this.logger.error(`Error getting daily analytics: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Nightly cron job to update analytics
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateAnalytics(): Promise<void> {
    try {
      this.logger.log("Starting nightly analytics update")

      // Update daily analytics for yesterday
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      await this.updateDailyAnalytics(yesterday)

      // Update summary analytics
      await this.updateAnalyticsSummary()

      // Mark processed events
      await this.markEventsAsProcessed(yesterday)

      this.logger.log("Completed nightly analytics update")
    } catch (error) {
      this.logger.error(`Error in nightly analytics update: ${error.message}`, error.stack)
    }
  }

  /**
   * Update daily analytics for a specific date
   * @param date The date to update analytics for
   */
  private async updateDailyAnalytics(date: Date): Promise<void> {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      // Count new signals for the day
      const newSignals = await this.eventRepository.count({
        where: {
          eventType: EventType.SIGNAL,
          timestamp: Between(startOfDay, endOfDay),
          processed: false,
        },
      })

      // Count new votes for the day
      const newVotes = await this.eventRepository.count({
        where: {
          eventType: EventType.VOTE,
          timestamp: Between(startOfDay, endOfDay),
          processed: false,
        },
      })

      // Count unique active users for the day
      const activeUsersResult = await this.eventRepository
        .createQueryBuilder("event")
        .select("COUNT(DISTINCT event.data->>'user')", "count")
        .where("event.timestamp BETWEEN :startOfDay AND :endOfDay", {
          startOfDay,
          endOfDay,
        })
        .andWhere("event.processed = :processed", { processed: false })
        .getRawOne()

      const activeUsers = Number.parseInt(activeUsersResult.count, 10)

      // Calculate amount staked for the day
      const stakedEvents = await this.eventRepository.find({
        where: {
          eventType: EventType.STAKE,
          timestamp: Between(startOfDay, endOfDay),
          processed: false,
        },
      })

      let amountStaked = ethers.BigNumber.from(0)
      for (const event of stakedEvents) {
        amountStaked = amountStaked.add(event.data.amount || 0)
      }

      // Calculate amount unstaked for the day
      const unstakedEvents = await this.eventRepository.find({
        where: {
          eventType: EventType.UNSTAKE,
          timestamp: Between(startOfDay, endOfDay),
          processed: false,
        },
      })

      let amountUnstaked = ethers.BigNumber.from(0)
      for (const event of unstakedEvents) {
        amountUnstaked = amountUnstaked.add(event.data.amount || 0)
      }

      // Update or create daily analytics record
      let dailyAnalytics = await this.dailyAnalyticsRepository.findOne({
        where: { date: startOfDay },
      })

      if (!dailyAnalytics) {
        dailyAnalytics = this.dailyAnalyticsRepository.create({
          date: startOfDay,
        })
      }

      dailyAnalytics.newSignals = newSignals
      dailyAnalytics.newVotes = newVotes
      dailyAnalytics.activeUsers = activeUsers
      dailyAnalytics.amountStaked = amountStaked.toString()
      dailyAnalytics.amountUnstaked = amountUnstaked.toString()

      await this.dailyAnalyticsRepository.save(dailyAnalytics)
      this.logger.log(`Updated daily analytics for ${startOfDay.toISOString().split("T")[0]}`)
    } catch (error) {
      this.logger.error(`Error updating daily analytics: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Update analytics summary
   */
  private async updateAnalyticsSummary(): Promise<void> {
    try {
      // Count total unique users
      const totalUsersResult = await this.eventRepository
        .createQueryBuilder("event")
        .select("COUNT(DISTINCT event.data->>'user')", "count")
        .getRawOne()

      const totalUsers = Number.parseInt(totalUsersResult.count, 10)

      // Count total signals
      const totalSignals = await this.eventRepository.count({
        where: { eventType: EventType.SIGNAL },
      })

      // Count total votes
      const totalVotes = await this.eventRepository.count({
        where: { eventType: EventType.VOTE },
      })

      // Calculate total staked (staked - unstaked)
      const stakedEvents = await this.eventRepository.find({
        where: { eventType: EventType.STAKE },
      })

      const unstakedEvents = await this.eventRepository.find({
        where: { eventType: EventType.UNSTAKE },
      })

      let totalStaked = ethers.BigNumber.from(0)

      for (const event of stakedEvents) {
        totalStaked = totalStaked.add(event.data.amount || 0)
      }

      for (const event of unstakedEvents) {
        totalStaked = totalStaked.sub(event.data.amount || 0)
      }

      // Update or create summary record
      let summary = await this.analyticsSummaryRepository.findOne({
        order: { updatedAt: "DESC" },
      })

      if (!summary) {
        summary = this.analyticsSummaryRepository.create()
      }

      summary.totalUsers = totalUsers
      summary.totalSignals = totalSignals
      summary.totalVotes = totalVotes
      summary.totalStaked = totalStaked.toString()
      summary.lastUpdated = new Date()

      await this.analyticsSummaryRepository.save(summary)
      this.logger.log("Updated analytics summary")
    } catch (error) {
      this.logger.error(`Error updating analytics summary: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Mark events as processed up to a certain date
   * @param date The cutoff date
   */
  private async markEventsAsProcessed(date: Date): Promise<void> {
    try {
      await this.eventRepository.update(
        {
          timestamp: LessThanOrEqual(date),
          processed: false,
        },
        {
          processed: true,
        },
      )

      this.logger.log(`Marked events as processed up to ${date.toISOString()}`)
    } catch (error) {
      this.logger.error(`Error marking events as processed: ${error.message}`, error.stack)
      throw error
    }
  }
}
