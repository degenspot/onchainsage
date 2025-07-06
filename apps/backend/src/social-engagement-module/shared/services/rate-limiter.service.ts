import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkLimit(
    _key: string,
    _limit: number,
    _window: number,
  ): Promise<boolean> {
    // Placeholder implementation
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async incrementCounter(key: string): Promise<number> {
    // Placeholder implementation
    return 1;
  }
}
