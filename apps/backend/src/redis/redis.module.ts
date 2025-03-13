import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: +configService.get<number>('REDIS_PORT'),
        ttl: +configService.get<number>('REDIS_TTL'), 
        // password: configService.get<string>('REDIS_PASSWORD', ''),
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService], 
})
export class RedisModule {}
