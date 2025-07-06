import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../common/decorators/rate-limit.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private rateLimiters = new Map<string, RateLimiterMemory>();

  constructor(private reflector: Reflector) {}

  use(req: Request, res: Response, next: NextFunction) {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      req.route?.handler || req.route?.path,
    );

    if (!options) {
      return next();
    }

    const ip = req.ip;
    const trackingKey = `${ip}:${req.originalUrl}`;

    let rateLimiter = this.rateLimiters.get(trackingKey);
    if (!rateLimiter) {
      rateLimiter = new RateLimiterMemory({
        points: options.points,
        duration: options.duration,
      });
      this.rateLimiters.set(trackingKey, rateLimiter);
    }

    // Use a custom property for tracking
    (req as any).rateLimitKey = trackingKey;

    rateLimiter
      .consume(trackingKey)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(429).send('Too Many Requests');
      });
  }
}

// import { Injectable, type NestMiddleware } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import rateLimit from 'express-rate-limit';

// @Injectable()
// export class RateLimitMiddleware implements NestMiddleware {
//   private rateLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
//     max: 100, // Limit each IP to 100 requests per windowMs
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//     message: { message: 'Too many requests', statusCode: 429 },
//     skipSuccessfulRequests: false, // Don't skip successful requests
//   });

//   use(req: Request, res: Response, next: NextFunction) {
//     this.rateLimiter(req, res, next);
//   }
// }
