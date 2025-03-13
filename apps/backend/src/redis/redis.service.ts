import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Preferences } from './types';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public async setUserPreferences(userId: string, preferences: Preferences) {
    try {
      const key = `appName:user:${userId}:preferences`;
      await this.cacheManager.set(
        `user:${userId}:preferences`,
        preferences,
        +process.env.REDIS_TTL || 3600
      );
      
      console.log(`User ${userId} preferences cached`);
    } catch (error) {
      console.error(`Error caching preferences for user ${userId}:`, error);
    }
  }

 public async getUserPreferences(userId: string): Promise<Preferences | null> {
    try {
      const key = `appName:user:${userId}:preferences`;
      const cachedPreferences = await this.cacheManager.get<Preferences>(key);
      if (cachedPreferences) {
        console.log(`Serving preferences for user ${userId} from cache`);
        return cachedPreferences;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching preferences for user ${userId}:`, error);
      return null;
    }
  }

public async deleteUserPreferences(userId: string) {
    try {
      const key = `appName:user:${userId}:preferences`;
      await this.cacheManager.del(key);
      console.log(`User ${userId} preferences removed from cache`);
    } catch (error) {
      console.error(`Error deleting preferences for user ${userId}:`, error);
    }
  }
}
