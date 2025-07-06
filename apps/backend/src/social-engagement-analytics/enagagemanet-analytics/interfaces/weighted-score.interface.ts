// src/engagement-analytics/interfaces/weighted-score.interface.ts
import { EngagementType } from '../entities/engagement.entity';

export interface UserReputationWeights {
  userId: string;
  multiplier: number;
  factors: {
    accountAge: number;
    previousEngagements: number;
    contentQuality: number;
    communityStanding: number;
  };
  lastUpdated: Date;
}

export interface EngagementTypeWeights {
  [EngagementType.LIKE]: number;
  [EngagementType.DISLIKE]: number;
  [EngagementType.COMMENT]: number;
  [EngagementType.SHARE]: number;
  [EngagementType.VIEW]: number;
}

export interface WeightedEngagement {
  engagementId: string;
  timestamp: Date;
  type: EngagementType;
  baseWeight: number;
  userReputationMultiplier: number;
  finalWeight: number;
}

// src/shared/interfaces/time-series.interface.ts
export interface TimeSeriesDataPoint<T> {
  timestamp: Date;
  value: T;
}

export interface TimeSeriesAggregation<T> {
  period: {
    start: Date;
    end: Date;
  };
  data: TimeSeriesDataPoint<T>[];
  aggregated: T;
}

export interface TimeSeriesWindow<T> {
  windowStart: Date;
  windowEnd: Date;
  dataPoints: TimeSeriesDataPoint<T>[];
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}
