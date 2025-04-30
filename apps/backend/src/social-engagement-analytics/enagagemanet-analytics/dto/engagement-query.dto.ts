// src/engagement-analytics/dto/engagement-query.dto.ts
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimeFrame {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom'
}

export class EngagementQueryDto {
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @IsOptional()
  @IsEnum(EngagementType, { each: true })
  types?: EngagementType[];

  @IsOptional()
  @IsEnum(TimeFrame)
  timeFrame?: TimeFrame = TimeFrame.DAY;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;

  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  groupBy?: string;
}