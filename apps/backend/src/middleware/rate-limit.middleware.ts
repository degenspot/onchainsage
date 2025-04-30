import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateLimitViolation } from '../entities/rate-limit-violation.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly protectedRoutes = [
    { path: '/signal', method: 'POST' },
    { path: '/vote', method: 'POST' },
    { path: '/webhook', method: 'POST' },
  ];

  // Default rate limit settings
  private readonly defaultRateLimit = {
    limit: 10,
    ttl: 60, // 60 seconds window
  };

  constructor(
    private readonly throttlerGuard: ThrottlerGuard,
    @InjectRepository(RateLimitViolation)
    private rateLimitViolationRepo: Repository<RateLimitViolation>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check if route is protected
    const isProtectedRoute = this.protectedRoutes.some(
      (route) => route.path === req.path && route.method === req.method,
    );

    if (!isProtectedRoute) {
      return next();
    }

    // Get IP address
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    
    // Get wallet address if available
    const walletAddress = req.headers['x-wallet-address'] as string || null;

    // Create tracking key - prioritize wallet if available, otherwise use IP
    const trackingKey = walletAddress ? `wallet:${walletAddress}` : `ip:${ipAddress}`;

    try {
      // Apply throttling using NestJS throttler
      // We're utilizing the ThrottlerGuard but calling it manually
      req.throttlerKey = trackingKey;
      
      // Apply rate limiting
      const throttlerContext = {
        getHandler: () => this.use,
        getClass: () => RateLimitMiddleware,
      };
      
      await this.throttlerGuard.handleRequest(
        { ...req, params: {}, query: {}, body: {} },
        res,
        throttlerContext,
      );
      
      return next();
    } catch (error) {
      if (error instanceof ThrottlerException) {
        // Log abuse attempt
        await this.logAbuseAttempt({
          ipAddress,
          walletAddress,
          endpoint: req.path,
          method: req.method,
          violatedRule: {
            limit: this.defaultRateLimit.limit,
            window: `${this.defaultRateLimit.ttl}s`,
          },
        });

        // Return standard throttling response
        res.status(429).json({
          statusCode: 429,
          message: 'Too Many Requests',
          error: 'Rate limit exceeded',
        });
      } else {
        // Pass through other errors
        next(error);
      }
    }
  }

  private async logAbuseAttempt(data: {
    ipAddress: string;
    walletAddress: string | null;
    endpoint: string;
    method: string;
    violatedRule: { limit: number; window: string };
  }) {
    try {
      const violation = new RateLimitViolation();
      violation.id = uuidv4();
      violation.ipAddress = data.ipAddress;
      violation.walletAddress = data.walletAddress;
      violation.endpoint = data.endpoint;
      violation.method = data.method;
      violation.timestamp = new Date();
      violation.violatedRule = data.violatedRule;

      await this.rateLimitViolationRepo.save(violation);
      this.logger.warn(`Rate limit violation recorded: ${JSON.stringify(data)}`);
    } catch (error) {
      this.logger.error(`Failed to log rate limit violation: ${error.message}`, error.stack);
    }
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
