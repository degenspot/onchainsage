import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common"
import { ThrottlerModule } from "@nestjs/throttler"
import { RedisModule } from "../redis/redis.module"
import { StatsController } from "./stats.controller"
import { StatsMiddleware } from "./stats.middleware"

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
  ],
  controllers: [StatsController],
})
export class StatsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(StatsMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
