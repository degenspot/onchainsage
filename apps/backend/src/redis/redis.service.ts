import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Preferences } from './types';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get('REDIS_PORT') || 6379,
    });
  }

  async getAsync(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setAsync(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  //fn to SET user preference
  public async setUserPreferences(userId: string, preferences: Preferences) {
    const key = `appName:user:${userId}:preferences`;
    const ttl = +this.configService.get('REDIS_TTL') || 3600;
    await this.setAsync(key, JSON.stringify(preferences), ttl);
    console.log(`User ${userId} preferences cached`);
  }

  //fn to GET user preference
  public async getUserPreferences(userId: string): Promise<Preferences | null> {
    const key = `appName:user:${userId}:preferences`;
    const cachedPreferences = await this.getAsync(key);
    if (cachedPreferences) {
      console.log(`fetching preferences for user ${userId} from cache`);
      return JSON.parse(cachedPreferences);
    }
    return null;
  }

  // fn to DELETE user preference
  public async deleteUserPreferences(userId: string) {
    const key = `appName:user:${userId}:preferences`;
    await this.del(key);
    console.log(`User ${userId} preferences removed from cache`);
  }

  // BATCH OPERATION : set multiple user preferences
  public async setMultipleUserPreferences(
    preferences: Record<string, Preferences>,
  ) {
    const pipeline = this.redis.pipeline();

    for (const [userId, userPreferences] of Object.entries(preferences)) {
      const key = `appName:user:${userId}:preferences`;
      const ttl = +this.configService.get('REDIS_TTL') || 3600;
      pipeline.setex(key, ttl, JSON.stringify(userPreferences));
    }

    await pipeline.exec(); // Execute all at once
    console.log('Batch user preferences cached');
  }

  // BATCH OPERATION : get multiple user preferences
  public async getMultipleUserPreferences(
    userIds: string[],
  ): Promise<Record<string, Preferences | null>> {
    const pipeline = this.redis.pipeline();

    userIds.forEach((userId) => {
      const key = `appName:user:${userId}:preferences`;
      pipeline.get(key);
    });

    const results = await pipeline.exec(); // Execute all at once

    const preferences: Record<string, Preferences | null> = {};
    userIds.forEach((userId, index) => {
      const value = results[index][1] as string | null;
      preferences[userId] = value ? JSON.parse(value) : null;
    });

    console.log('Batch user preferences fetched');
    return preferences;
  }

  // CACHE WARMING STRATEGY
  public async warmUpCache() {
    console.log('Warming up cache...');
    const commonUserIds = ['user1', 'user2', 'user3']; //  user IDs sample

    for (const userId of commonUserIds) {
      const key = `appName:user:${userId}:preferences`;
      const existing = await this.getAsync(key);
      if (!existing) {
        console.log(`Preloading preferences for user ${userId}`);
        const preferences = await this.fetchPreferencesFromDatabase(userId);
        if (preferences) {
          const ttl = +this.configService.get('REDIS_TTL') || 3600;
          await this.setAsync(key, JSON.stringify(preferences), ttl);
        }
      }
    }
  }

  // Mock function to simulate fetching preferences from the DB
  private async fetchPreferencesFromDatabase(
    userId: string,
  ): Promise<Preferences | null> {
    return {
      theme: 'dark',
      notifications: true,
      language: 'en',
    };
  }

  //CACHE INVALIDATION PATTERN: when preferences changes
  public async invalidateUserPreferences(userId: string) {
    const key = `appName:user:${userId}:preferences`;
    await this.del(key);
    console.log(`Cache invalidated for user ${userId}`);
  }

  // Example: Invalidate cache on data update
  public async updateUserPreferences(userId: string, preferences: Preferences) {
    await this.setUserPreferences(userId, preferences);
    await this.invalidateUserPreferences(userId);
  }
}
