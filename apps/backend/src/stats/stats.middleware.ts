import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import type { RedisService } from '../redis/redis.service';

@Injectable()
export class StatsMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;

    // Track specific endpoints
    if (path.startsWith('/signals')) {
      await this.redisService.increment('api:requests:signals');
    } else if (path.startsWith('/users/preferences')) {
      await this.redisService.increment('api:requests:preferences');
    }

    next();
  }
}
