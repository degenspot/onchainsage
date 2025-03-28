import { Module } from "@nestjs/common"
import { ThrottlerModule } from "@nestjs/throttler"
import { RedisModule } from "../redis/redis.module"
import { StatsController } from "./controllers/stats.controller"

@Module({
  imports: [
    RedisModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
  ],
  controllers: [StatsController],
})
export class StatsModule {}

