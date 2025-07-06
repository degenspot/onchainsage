import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const getThrottlerConfig = (configService: ConfigService) => {
  return ThrottlerModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      ttl: config.get('THROTTLE_TTL', 60), // Default 60 seconds window
      limit: config.get('THROTTLE_LIMIT', 10), // Default 10 requests per window
      throttlers: [
        {
          ttl: config.get('THROTTLE_TTL', 60),
          limit: config.get('THROTTLE_LIMIT', 10),
        },
      ],
      // Using memory storage instead of Redis
    }),
  });
};