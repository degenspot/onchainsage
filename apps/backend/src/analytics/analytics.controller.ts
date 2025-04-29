import { Controller, Get, Query, ParseDatePipe, DefaultValuePipe, Logger } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger"
import type { AnalyticsService } from "./analytics.service"
import { AnalyticsSummary } from "./entities/analytics-summary.entity"
import { DailyAnalytics } from "./entities/daily-analytics.entity"

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name)

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("summary")
  @ApiOperation({ summary: "Get analytics summary" })
  @ApiResponse({
    status: 200,
    description: "Returns overall statistics such as total staked, total users, signals, etc.",
    type: AnalyticsSummary,
  })
  async getSummary(): Promise<AnalyticsSummary> {
    this.logger.log("Getting analytics summary")
    return this.analyticsService.getSummary()
  }

  @Get("daily")
  @ApiOperation({ summary: "Get daily analytics" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: Date,
    description: "Start date for the range (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: Date,
    description: "End date for the range (YYYY-MM-DD)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns daily breakdown of new signals and votes",
    type: [DailyAnalytics],
  })
  async getDailyAnalytics(
    @Query('startDate', new DefaultValuePipe(this.getDefaultStartDate()), ParseDatePipe) startDate: Date,
    @Query('endDate', new DefaultValuePipe(new Date()), ParseDatePipe) endDate: Date,
  ): Promise<DailyAnalytics[]> {
    this.logger.log(`Getting daily analytics from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    return await this.analyticsService.getDailyAnalytics(startDate, endDate)
  }

  private getDefaultStartDate(): Date {
    const date = new Date()
    date.setDate(date.getDate() - 30) // Default to last 30 days
    return date
  }
}
