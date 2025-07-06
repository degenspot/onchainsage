import {
  Controller,
  Get,
  Query,
  DefaultValuePipe,
  Logger,
} from '@nestjs/common';
import type { AnalyticsService } from './analytics.service';
import { AnalyticsSummary } from './entities/analytics-summary.entity';
import { DailyAnalytics } from './entities/daily-analytics.entity';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(): Promise<AnalyticsSummary> {
    this.logger.log('Getting analytics summary');
    return this.analyticsService.getSummary();
  }

  @Get('daily')
  async getDailyAnalytics(
    @Query(
      'startDate',
      new DefaultValuePipe(
        new Date(new Date().setDate(new Date().getDate() - 30)),
      ),
    )
    startDate: string,
    @Query('endDate', new DefaultValuePipe(new Date())) endDate: string,
  ): Promise<DailyAnalytics[]> {
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    this.logger.log(
      `Getting daily analytics from ${parsedStartDate.toISOString()} to ${parsedEndDate.toISOString()}`,
    );
    return await this.analyticsService.getDailyAnalytics(
      parsedStartDate,
      parsedEndDate,
    );
  }

  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }
}
