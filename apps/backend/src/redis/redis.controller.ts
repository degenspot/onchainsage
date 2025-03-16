import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  //route to test cache warmUp
  @Get('warm-up')
  async warmUpCache() {
    await this.redisService.warmUpCache();
    const preferences = await this.redisService.getUserPreferences('user1');
    console.log('Warmed-up Preferences for user1:', preferences);
    return preferences;
  }

  //route to check invalidation of user preference
  @Get('invalidate')
  public async invalidateCache() {
    await this.redisService.setUserPreferences('user1', {
      theme: 'dark',
      notifications: true,
      language: 'en',
    });

    console.log(
      'Before Invalidation:',
      await this.redisService.getUserPreferences('user1'),
    );

    await this.redisService.invalidateUserPreferences('user1');

    console.log(
      'After Invalidation:',
      await this.redisService.getUserPreferences('user1'),
    );

    return 'Cache invalidation test completed';
  }

  // route to confirm user prefernce invalidation working
  @Get('check-cache')
  public async checkCache() {
    const preferences = await this.redisService.getUserPreferences('user1');
    console.log('Checked Preferences for user1:', preferences);
    return preferences || 'Cache is empty';
  }
}
