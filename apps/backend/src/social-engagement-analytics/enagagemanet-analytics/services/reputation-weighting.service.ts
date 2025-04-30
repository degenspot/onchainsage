// src/engagement-analytics/services/reputation-weighting.service.ts
import { Injectable } from '@nestjs/common';
import { UserReputationWeights, EngagementTypeWeights } from '../interfaces/weighted-score.interface';
import { EngagementType } from '../entities/engagement.entity';

@Injectable()
export class ReputationWeightingService {
  // Default weights for different engagement types
  private readonly DEFAULT_TYPE_WEIGHTS: EngagementTypeWeights = {
    [EngagementType.LIKE]: 1.0,
    [EngagementType.DISLIKE]: 1.2, // Slightly higher impact for dislikes
    [EngagementType.COMMENT]: 2.0, // Comments require more effort
    [EngagementType.SHARE]: 3.0,   // Shares have higher impact
    [EngagementType.VIEW]: 0.1,    // Views have minimal impact
  };
  
  private typeWeights: EngagementTypeWeights = { ...this.DEFAULT_TYPE_WEIGHTS };
  
  // Cache of user reputation weights
  private userReputationCache = new Map<string, UserReputationWeights>();
  
  constructor(
    // Inject user service or repository for fetching user data
  ) {}
  
  /**
   * Calculate the weight multiplier for a given user based on their reputation
   */
  async getUserReputationMultiplier(userId: string): Promise<number> {
    // Check cache first
    if (this.userReputationCache.has(userId)) {
      const cached = this.userReputationCache.get(userId);
      // Check if cache is still fresh (less than 24 hours old)
      if (new Date().getTime() - cached.lastUpdated.getTime() < 86400000) {
        return cached.multiplier;
      }
    }
    
    // Calculate reputation weights for user
    const weights = await this.calculateUserReputationWeights(userId);
    
    // Cache the result
    this.userReputationCache.set(userId, weights);
    
    return weights.multiplier;
  }
  
  /**
   * Calculate the weighted score for an engagement
   */
  async calculateEngagementWeight(
    userId: string, 
    type: EngagementType,
  ): Promise<number> {
    const userMultiplier = await this.getUserReputationMultiplier(userId);
    const typeWeight = this.getEngagementTypeWeight(type);
    
    return typeWeight * userMultiplier;
  }
  
  /**
   * Get the base weight for an engagement type
   */
  getEngagementTypeWeight(type: EngagementType): number {
    return this.typeWeights[type] || 1.0;
  }
  
  /**
   * Update the weight configuration for engagement types
   */
  updateEngagementTypeWeights(weights: Partial<EngagementTypeWeights>): void {
    this.typeWeights = {
      ...this.typeWeights,
      ...weights,
    };
  }
  
  /**
   * Reset engagement type weights to defaults
   */
  resetEngagementTypeWeights(): void {
    this.typeWeights = { ...this.DEFAULT_TYPE_WEIGHTS };
  }
  
  /**
   * Calculate reputation weights for a user based on their history and behavior
   * This is where sophisticated algorithms would evaluate user trustworthiness
   */
  private async calculateUserReputationWeights(userId: string): Promise<UserReputationWeights> {
    // In a real implementation, this would query user data, engagement history, etc.
    // For this example, we'll use placeholder logic
    
    // Placeholder values that would come from user history analysis
    const accountAgeFactor = 0.8; // 0-1 based on account age
    const previousEngagementsFactor = 0.9; // 0-1 based on previous engagement quality
    const contentQualityFactor = 0.7; // 0-1 based on quality of user's content
    const communityStandingFactor = 0.85; // 0-1 based on community standing
    
    // Calculate overall multiplier
    const multiplier = (
      accountAgeFactor +
      previousEngagementsFactor +
      contentQualityFactor +
      communityStandingFactor
    ) / 4;
    
    return {
      userId,
      multiplier,
      factors: {
        accountAge: accountAgeFactor,
        previousEngagements: previousEngagementsFactor,
        contentQuality: contentQualityFactor,
        communityStanding: communityStandingFactor,
      },
      lastUpdated: new Date(),
    };
  }
}

