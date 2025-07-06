import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  points: number;
  duration: number;
}

export const RateLimit = (points: number, duration: number) => SetMetadata(RATE_LIMIT_KEY, { points, duration });
