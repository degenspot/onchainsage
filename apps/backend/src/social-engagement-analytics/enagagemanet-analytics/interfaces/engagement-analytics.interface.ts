// src/engagement-analytics/interfaces/engagement-analytics.interface.ts
import { EngagementType } from '../entities/engagement.entity';

export interface EngagementCount {
  type: EngagementType;
  count: number;
  weightedScore: number;
}

export interface EngagementTimeSeries {
  timestamp: Date;
  engagements: EngagementCount[];
  total: number;
  weightedTotal: number;
}

export interface EngagementSummary {
  contentId?: string;
  period: {
    start: Date;
    end: Date;
  };
  totalEngagements: number;
  engagementsByType: Record<EngagementType, number>;
  weightedScores: Record<EngagementType, number>;
  totalWeightedScore: number;
  sentimentScore: number;
  trendData: EngagementTimeSeries[];
  anomalies: EngagementAnomaly[];
}

export interface EngagementAnomaly {
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}
