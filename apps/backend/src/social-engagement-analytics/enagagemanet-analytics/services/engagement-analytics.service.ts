// src/engagement-analytics/services/engagement-analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EngagementRepository } from '../repositories/engagement.repository';
import { ReputationWeightingService } from './reputation-weighting.service';
import { EngagementQueryDto } from '../dto/engagement-query.dto';
import { EngagementSummary, EngagementTimeSeries } from '../interfaces/engagement-analytics.interface';
import { EngagementType, Engagement } from '../entities/engagement.entity';
import { CreateEngagementDto } from '../dto/create-engagement.dto';
import { EngagementCacheService } from '../../shared/cache/engagement-cache.service';
import { AnomalyDetectionUtil } from '../../shared/utils/anomaly-detection.util';

@Injectable()
export class EngagementAnalyticsService {
  private readonly logger = new Logger(EngagementAnalyticsService.name);

  constructor(
    private readonly engagementRepository: EngagementRepository,
    private readonly reputationService: ReputationWeightingService,
    private readonly cacheService: EngagementCacheService,
    private readonly anomalyDetection: AnomalyDetectionUtil,
  ) {}

  /**
   * Create a new engagement record with weighted scoring
   */
  async recordEngagement(createDto: CreateEngagementDto): Promise<Engagement> {
    // Calculate weight based on user reputation and engagement type
    const weight = await this.reputationService.calculateEngagementWeight(
      createDto.userId,
      createDto.type,
    );
    
    // Create engagement entity with calculated weight
    const engagement = await this.engagementRepository.create({
      ...createDto,
      weight,
    });
    
    // Invalidate cache for related content
    await this.cacheService.invalidateContentEngagement(createDto.contentId);
    
    return engagement;
  }

  /**
   * Get engagement analytics for specified criteria
   */
  async getEngagementAnalytics(query: EngagementQueryDto): Promise<EngagementSummary> {
    const cacheKey = `engagement:${JSON.stringify(query)}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get<EngagementSummary>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Get time series data
    const timeSeries = await this.engagementRepository.getTimeSeriesData(query);
    
    // Get counts by type
    const engagementsByType = await this.getEngagementCountsByType(query);
    
    // Calculate weighted scores
    const weightedScores = this.calculateWeightedScores(timeSeries);
    
    // Detect anomalies in the data
    const anomalies = this.anomalyDetection.detectAnomalies(timeSeries);
    
    // Calculate sentiment score (-1 to 1)
    const sentimentScore = this.calculateSentimentScore(weightedScores);
    
    // Calculate total engagements
    const totalEngagements = Object.values(engagementsByType).reduce((sum, count) => sum + count, 0);
    
    // Calculate total weighted score
    const totalWeightedScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    
    // Determine time period
    const period = this.getTimePeriod(query, timeSeries);
    
    // Construct the summary
    const summary: EngagementSummary = {
      contentId: query.contentId,
      period,
      totalEngagements,
      engagementsByType,
      weightedScores,
      totalWeightedScore,
      sentimentScore,
      trendData: timeSeries,
      anomalies,
    };
    
    // Cache the result
    await this.cacheService.set(cacheKey, summary, 60 * 5); // Cache for 5 minutes
    
    return summary;
  }
  
  /**
   * Get raw time series data
   */
  async getTimeSeriesData(query: EngagementQueryDto): Promise<EngagementTimeSeries[]> {
    return this.engagementRepository.getTimeSeriesData(query);
  }
  
  /**
   * Get engagement counts by type for the given query
   */
  private async getEngagementCountsByType(query: EngagementQueryDto): Promise<Record<EngagementType, number>> {
    if (query.contentId) {
      // If querying for a specific content, use the repository method
      return this.engagementRepository.countByType(query.contentId);
    } else {
      // For more complex queries, we need to calculate from the time series data
      const timeSeries = await this.engagementRepository.getTimeSeriesData(query);
      
      // Initialize counts object with all engagement types
      const counts: Record<EngagementType, number> = {
        [EngagementType.LIKE]: 0,
        [EngagementType.DISLIKE]: 0,
        [EngagementType.COMMENT]: 0,
        [EngagementType.SHARE]: 0,
        [EngagementType.VIEW]: 0,
      };
      
      // Sum up counts across all time points
      timeSeries.forEach(point => {
        point.engagements.forEach(engagement => {
          counts[engagement.type] += engagement.count;
        });
      });
      
      return counts;
    }
  }
  
  /**
   * Calculate weighted scores for each engagement type
   */
  private calculateWeightedScores(timeSeries: EngagementTimeSeries[]): Record<EngagementType, number> {
    const scores: Record<EngagementType, number> = {
      [EngagementType.LIKE]: 0,
      [EngagementType.DISLIKE]: 0,
      [EngagementType.COMMENT]: 0,
      [EngagementType.SHARE]: 0,
      [EngagementType.VIEW]: 0,
    };
    
    timeSeries.forEach(point => {
      point.engagements.forEach(engagement => {
        scores[engagement.type] += engagement.weightedScore;
      });
    });
    
    return scores;
  }
  
  /**
   * Calculate a sentiment score based on weighted engagement
   * Returns a value between -1 (negative) and 1 (positive)
   */
  private calculateSentimentScore(weightedScores: Record<EngagementType, number>): number {
    const positive = weightedScores[EngagementType.LIKE] + weightedScores[EngagementType.SHARE];
    const negative = weightedScores[EngagementType.DISLIKE];
    const total = positive + negative;
    
    if (total === 0) {
      return 0;
    }
    
    return (positive - negative) / total;
  }
  
  /**
   * Determine the time period covered by the query and data
   */
  private getTimePeriod(query: EngagementQueryDto, timeSeries: EngagementTimeSeries[]): { start: Date; end: Date } {
    // If explicit dates were provided in the query, use those
    if (query.startDate && query.endDate) {
      return {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      };
    }
    
    // Otherwise, determine from the time series data
    if (timeSeries.length > 0) {
      const timestamps = timeSeries.map(point => point.timestamp);
      return {
        start: new Date(Math.min(...timestamps.map(d => d.getTime()))),
        end: new Date(Math.max(...timestamps.map(d => d.getTime()))),
      };
    }
    
    // Fallback to repository's time range calculation
    return this.engagementRepository.getTimeRange(query.timeFrame);
  }
}
