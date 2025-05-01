import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private rateLimiters: Map<string, RateLimiterMemory> = new Map();

  constructor(private reflector: Reflector) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const handler = req.route?.stack[req.route.stack.length - 1]?.handle;

    if (!handler) {
      return next();
    }

    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      handler,
    );

    if (!options) {
      return next();
    }

    const key = `${req.ip}:${req.path}`;

    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(
        key,
        new RateLimiterMemory({
          points: options.points,
          duration: options.duration,
        }),
      );
    }

    const rateLimiter = this.rateLimiters.get(key);

    try {
      await rateLimiter.consume(req.ip);
      next();
    } catch (e) {
      const retryAfter = Math.ceil(e.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(retryAfter));
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
