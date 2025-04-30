// src/shared/utils/anomaly-detection.util.ts
import { Injectable } from '@nestjs/common';
import { EngagementAnomaly, EngagementTimeSeries } from '../../engagement-analytics/interfaces/engagement-analytics.interface';
import { EngagementType } from '../../engagement-analytics/entities/engagement.entity';

@Injectable()
export class AnomalyDetectionUtil {
  // Threshold for determining if a deviation is significant enough to be an anomaly
  private readonly ANOMALY_THRESHOLD = 2.0;

  /**
   * Detect anomalies in engagement time series data
   */
  detectAnomalies(timeSeries: EngagementTimeSeries[]): EngagementAnomaly[] {
    const anomalies: EngagementAnomaly[] = [];
    
    // Skip if not enough data points
    if (timeSeries.length < 3) {
      return anomalies;
    }
    
    // Get all engagement types present in the data
    const engagementTypes = new Set<EngagementType>();
    timeSeries.forEach(point => {
      point.engagements.forEach(engagement => {
        engagementTypes.add(engagement.type);
      });
    });
    
    // For each engagement type, detect anomalies
    engagementTypes.forEach(type => {
      // Extract counts for this engagement type
      const typeCounts = timeSeries.map(point => {
        const engagement = point.engagements.find(e => e.type === type);
        return {
          timestamp: point.timestamp,
          count: engagement ? engagement.count : 0
        };
      });
      
      // Calculate moving average and standard deviation
      const windowSize = 3; // Use 3 data points for the moving window
      
      for (let i = windowSize; i < typeCounts.length; i++) {
        const window = typeCounts.slice(i - windowSize, i);
        const currentPoint = typeCounts[i];
        
        // Calculate mean and standard deviation of the window
        const mean = window.reduce((sum, point) => sum + point.count, 0) / window.length;
        const variance = window.reduce((sum, point) => sum + Math.pow(point.count - mean, 2), 0) / window.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate z-score (number of standard deviations from the mean)
        const zScore = stdDev === 0 ? 0 : (currentPoint.count - mean) / stdDev;
        
        // If z-score exceeds threshold, it's an anomaly
        if (Math.abs(zScore) > this.ANOMALY_THRESHOLD) {
          anomalies.push({
            timestamp: currentPoint.timestamp,
            type,
            expected: mean,
            actual: currentPoint.count,
            deviation: currentPoint.count - mean,
            significance: Math.abs(zScore)
          });
        }
      }
    });
    
    return anomalies;
  }
}