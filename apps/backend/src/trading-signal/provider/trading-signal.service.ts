import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class TradingSignalService {
  private readonly socialSentimentAPI = 'https://api.example.com/social-sentiment';
  private readonly onChainMetricsAPI = 'https://api.example.com/on-chain-metrics';

  constructor(private readonly httpService: HttpService) {}

  async fetchSocialSentiment(): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.get(this.socialSentimentAPI));
      return response.data;
    } catch (error) {
      console.error('Error fetching social sentiment:', error.message);
      throw new HttpException('Failed to fetch social sentiment data', HttpStatus.BAD_GATEWAY);
    }
  }

  
  async fetchOnChainMetrics(): Promise<any> {
    try {
      const response = await lastValueFrom(this.httpService.get(this.onChainMetricsAPI));
      return response.data;
    } catch (error) {
      throw new HttpException('Failed to fetch on-chain metrics', HttpStatus.BAD_GATEWAY);
    }
  }

  async generateTradingSignals(): Promise<any> {
    const [socialSentiment, onChainMetrics] = await Promise.all([
      this.fetchSocialSentiment(),
      this.fetchOnChainMetrics(),
    ]);

    // Example signal logic: Buy if sentiment is high & on-chain activity is bullish
    const buySignal = socialSentiment.score > 70 && onChainMetrics.trend === 'bullish';
    const sellSignal = socialSentiment.score < 30 && onChainMetrics.trend === 'bearish';

    return {
      buy: buySignal,
      sell: sellSignal,
      sentimentScore: socialSentiment.score,
      onChainTrend: onChainMetrics.trend,
    };
  }
}
