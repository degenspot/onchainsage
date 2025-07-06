// src/engagement-analytics/controllers/engagement-analytics.controller.ts
import { Controller, Get, Post, Body, Query, Param, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EngagementAnalyticsService } from '../services/engagement-analytics.service';
import { CreateEngagementDto } from '../dto/create-engagement.dto';
import { EngagementQueryDto, TimeFrame } from '../dto/engagement-query.dto';
import { Engagement } from '../entities/engagement.entity';
import { EngagementSummary, EngagementTimeSeries } from '../interfaces/engagement-analytics.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('engagement-analytics')
@Controller('engagement-analytics')
export class EngagementAnalyticsController {
  private readonly logger = new Logger(EngagementAnalyticsController.name);

  constructor(private readonly analyticsService: EngagementAnalyticsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Record a new engagement' })
  @ApiResponse({ status: 201, description: 'Engagement recorded successfully', type: Engagement })
  @ApiBody({ type: CreateEngagementDto })
  async recordEngagement(@Body() createDto: CreateEngagementDto): Promise<Engagement> {
    try {
      return await this.analyticsService.recordEngagement(createDto);
    } catch (error) {
      this.logger.error(`Failed to record engagement: ${error.message}`, error.stack);
      throw new HttpException('Failed to record engagement', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @CacheTTL(300) // 5 minute cache
  @ApiOperation({ summary: 'Get engagement analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiQuery({ name: 'contentId', required: false })
  @ApiQuery({ name: 'timeFrame', enum: TimeFrame, required: false })
  async getAnalytics(@Query() queryDto: EngagementQueryDto): Promise<EngagementSummary> {
    try {
      return await this.analyticsService.getEngagementAnalytics(queryDto);
    } catch (error) {
      this.logger.error(`Failed to get analytics: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve analytics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('time-series')
  @CacheTTL(300) // 5 minute cache
  @ApiOperation({ summary: 'Get engagement time series data' })
  @ApiResponse({ status: 200, description: 'Time series data retrieved successfully' })
  async getTimeSeriesData(@Query() queryDto: EngagementQueryDto): Promise<EngagementTimeSeries[]> {
    try {
      return await this.analyticsService.getTimeSeriesData(queryDto);
    } catch (error) {
      this.logger.error(`Failed to get time series data: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve time series data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('content/:contentId')
  @CacheTTL(300) // 5 minute cache
  @ApiOperation({ summary: 'Get analytics for a specific content item' })
  @ApiResponse({ status: 200, description: 'Content analytics retrieved successfully' })
  @ApiParam({ name: 'contentId', required: true })
  async getContentAnalytics(
    @Param('contentId') contentId: string,
    @Query() queryDto: EngagementQueryDto,
  ): Promise<EngagementSummary> {
    try {
      return await this.analyticsService.getEngagementAnalytics({
        ...queryDto,
        contentId,
      });
    } catch (error) {
      this.logger.error(`Failed to get content analytics: ${error.message}`, error.stack);
      throw new HttpException('Failed to retrieve content analytics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}