/**
 * Interface for weighted signal objects used in ranking
 */
export interface WeightedSignal<T> {
  signal: T;
  weight: number;
}

/**
 * Configuration options for signal ranking algorithm
 */
export interface RankingOptions {
  /**
   * Decay factor for signal recency (higher = faster decay)
   * Default: 0.01
   */
  decayFactor?: number;

  /**
   * Maximum age in hours to consider for ranking
   * Default: 168 (7 days)
   */
  maxAgeHours?: number;

  /**
   * Weight for reputation in the ranking formula (0-1)
   * Default: 0.7
   */
  reputationWeight?: number;

  /**
   * Weight for recency in the ranking formula (0-1)
   * Default: 0.3
   */
  recencyWeight?: number;
}
