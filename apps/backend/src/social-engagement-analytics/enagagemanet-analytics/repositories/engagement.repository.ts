// src/engagement-analytics/repositories/engagement.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Engagement, EngagementType } from '../entities/engagement.entity';
import { EngagementQueryDto, TimeFrame } from '../dto/engagement-query.dto';
import { EngagementTimeSeries } from '../interfaces/engagement-analytics.interface';

@Injectable()
export class EngagementRepository {
  constructor(
    @InjectRepository(Engagement)
    private engagementRepository: Repository<Engagement>,
  ) {}

  async create(engagement: Partial<Engagement>): Promise<Engagement> {
    const newEngagement = this.engagementRepository.create(engagement);
    return this.engagementRepository.save(newEngagement);
  }

  async findById(id: string): Promise<Engagement> {
    return this.engagementRepository.findOne({ where: { id } });
  }

  async findByContentId(contentId: string): Promise<Engagement[]> {
    return this.engagementRepository.find({
      where: { contentId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Engagement[]> {
    return this.engagementRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async countByType(contentId: string): Promise<Record<EngagementType, number>> {
    const result = await this.engagementRepository
      .createQueryBuilder('engagement')
      .select('engagement.type', 'type')
      .addSelect('COUNT(engagement.id)', 'count')
      .where('engagement.contentId = :contentId', { contentId })
      .groupBy('engagement.type')
      .getRawMany();

    return result.reduce((acc, { type, count }) => {
      acc[type] = parseInt(count, 10);
      return acc;
    }, {} as Record<EngagementType, number>);
  }

  async findByTimeFrame(query: EngagementQueryDto): Promise<Engagement[]> {
    const { startDate, endDate, contentId, types, limit, offset } = query;
    
    const where: FindOptionsWhere<Engagement> = {};
    
    if (contentId) {
      where.contentId = contentId;
    }
    
    if (types && types.length > 0) {
      where.type = types.length === 1 ? types[0] : types;
    }
    
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else {
      const { start, end } = this.getTimeRange(query.timeFrame);
      where.createdAt = Between(start, end);
    }

    return this.engagementRepository.find({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });
  }
  
  async getTimeSeriesData(query: EngagementQueryDto): Promise<EngagementTimeSeries[]> {
    const { startDate, endDate, contentId, timeFrame } = query;
    
    const dateRange = startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : this.getTimeRange(timeFrame);
    
    const interval = this.getTimeInterval(timeFrame);
    
    const result = await this.engagementRepository
      .createQueryBuilder('engagement')
      .select(`date_trunc('${interval}', engagement.createdAt)`, 'timestamp')
      .addSelect('engagement.type', 'type')
      .addSelect('COUNT(engagement.id)', 'count')
      .addSelect('SUM(engagement.weight)', 'weightedScore')
      .where('engagement.createdAt BETWEEN :start AND :end', { 
        start: dateRange.start, 
        end: dateRange.end 
      })
      .andWhere(contentId ? 'engagement.contentId = :contentId' : '1=1', { contentId })
      .groupBy('timestamp, engagement.type')
      .orderBy('timestamp', 'ASC')
      .getRawMany();
    
    // Transform the raw SQL results into the expected format
    const timeSeriesMap = new Map<string, EngagementTimeSeries>();
    
    result.forEach(row => {
      const timestamp = new Date(row.timestamp);
      const timeKey = timestamp.toISOString();
      
      if (!timeSeriesMap.has(timeKey)) {
        timeSeriesMap.set(timeKey, {
          timestamp,
          engagements: [],
          total: 0,
          weightedTotal: 0
        });
      }
      
      const timeSeries = timeSeriesMap.get(timeKey);
      const count = parseInt(row.count, 10);
      const weightedScore = parseFloat(row.weightedScore);
      
      timeSeries.engagements.push({
        type: row.type,
        count,
        weightedScore
      });
      
      timeSeries.total += count;
      timeSeries.weightedTotal += weightedScore;
    });
    
    return Array.from(timeSeriesMap.values());
  }
  
  private getTimeRange(timeFrame: TimeFrame): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);
    
    switch (timeFrame) {
      case TimeFrame.HOUR:
        start.setHours(start.getHours() - 1);
        break;
      case TimeFrame.DAY:
        start.setDate(start.getDate() - 1);
        break;
      case TimeFrame.WEEK:
        start.setDate(start.getDate() - 7);
        break;
      case TimeFrame.MONTH:
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start.setDate(start.getDate() - 1); // Default to 1 day
    }
    
    return { start, end };
  }
  
  private getTimeInterval(timeFrame: TimeFrame): string {
    switch (timeFrame) {
      case TimeFrame.HOUR:
        return 'minute';
      case TimeFrame.DAY:
        return 'hour';
      case TimeFrame.WEEK:
        return 'day';
      case TimeFrame.MONTH:
        return 'day';
      default:
        return 'hour';
    }
  }
}