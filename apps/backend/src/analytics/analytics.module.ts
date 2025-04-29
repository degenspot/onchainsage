import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ScheduleModule } from "@nestjs/schedule"
import { AnalyticsController } from "./analytics.controller"
import { AnalyticsService } from "./analytics.service"
import { EventIndexerService } from "./event-indexer.service"
import { SmartContractEvent } from "./entities/smart-contract-event.entity"
import { DailyAnalytics } from "./entities/daily-analytics.entity"
import { AnalyticsSummary } from "./entities/analytics-summary.entity"

@Module({
  imports: [TypeOrmModule.forFeature([SmartContractEvent, DailyAnalytics, AnalyticsSummary]), ScheduleModule.forRoot()],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, EventIndexerService],
  exports: [AnalyticsService, EventIndexerService],
})
export class AnalyticsModule {}
