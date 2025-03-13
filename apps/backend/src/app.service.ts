import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { Preferences } from './redis/types';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name); //middleware

  constructor(
    private redisService: RedisService
  ) {}

  public getHello(): string {
    return 'Hello World!';
  }

  public async handleUserPreferences(userId: string): Promise<Preferences> {
    // Check cache first
    const cachedPreferences =
      await this.redisService.getUserPreferences(userId);
    if (cachedPreferences) {
      this.logger.log(`Fetched preferences for user ${userId} from cache`);
      return cachedPreferences;
    }

    // Simulate fetching data from DB or external service
    const userPreferences: Preferences = { theme: 'dark', language: 'en' };
    this.logger.log(`Fetched preferences for user ${userId} from DB`);

    // Cache the data for next time usage
    await this.redisService.setUserPreferences(userId, userPreferences);
    this.logger.log(`Cached preferences for user ${userId}`);

    return userPreferences;
  }
}
