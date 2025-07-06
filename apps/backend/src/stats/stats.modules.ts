import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { StatsController } from './stats.controller';
import { StatsMiddleware } from './stats.middleware';
import { StatsService } from './stats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../forum_module/entities/post.entity';
import { ForumReport } from '../forum-report/entities/forum-report.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, ForumReport, User]),
    RedisModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
  ],
  providers: [StatsService],
  controllers: [StatsController],
  exports: [StatsService],
})
export class StatsModule {
  constructor(private readonly redisService: RedisService) {}

  configure(consumer: MiddlewareConsumer) {
    const statsMiddleware = new StatsMiddleware(this.redisService);
    consumer
      .apply((req, res, next) => statsMiddleware.use(req, res, next))
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
