import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { ConfigService } from '@nestjs/config';

export const getThrottlerConfig = (configService: ConfigService) => {
  return ThrottlerModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      ttl: config.get('THROTTLE_TTL', 60), // Default 60 seconds window
      limit: config.get('THROTTLE_LIMIT', 10), // Default 10 requests per window
      storage: new ThrottlerStorageRedisService({
        host: config.get('REDIS_HOST', 'localhost'),
        port: config.get('REDIS_PORT', 6379),
        password: config.get('REDIS_PASSWORD', ''),
        keyPrefix: 'throttle:',
      }),
    }),
  });
};