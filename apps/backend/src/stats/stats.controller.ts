import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly redisService: RedisService) {}

  @Get('signals')
  async getSignalsCount(): Promise<number> {
    const count = await this.redisService.get('api:requests:signals');
    return parseInt(count || '0', 10);
  }

  @Get('preferences')
  async getPreferencesCount(): Promise<number> {
    const count = await this.redisService.get('api:requests:preferences');
    return parseInt(count || '0', 10);
  }
}
