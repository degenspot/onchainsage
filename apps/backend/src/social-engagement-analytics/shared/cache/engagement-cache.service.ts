// src/shared/cache/engagement-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class EngagementCacheService {
  private readonly logger = new Logger(EngagementCacheService.name);
  private readonly ttl = 300; // 5 minutes default TTL

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl || this.ttl);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Invalidate cache for a content item's engagement data
   */
  async invalidateContentEngagement(contentId: string): Promise<void> {
    try {
      // Use pattern matching to delete all keys related to this content
      const keys = await this.findCacheKeys(`engagement:*${contentId}*`);

      // Delete all matched keys
      for (const key of keys) {
        await this.delete(key);
      }

      this.logger.debug(
        `Invalidated ${keys.length} cache entries for content ${contentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error invalidating content cache for ${contentId}: ${error.message}`,
      );
    }
  }

  /**
   * Find all cache keys matching a pattern
   * Note: This implementation is simplified and would need to be adjusted
   * based on the actual cache provider being used
   */
  private async findCacheKeys(pattern: string): Promise<string[]> {
    // This is a placeholder. In production, you'd use cache-specific methods
    // like Redis SCAN command if using Redis

    // For demonstration purposes, we'll return a mock key
    return [`engagement:content:${pattern.split('*')[1]}`];
  }
}
