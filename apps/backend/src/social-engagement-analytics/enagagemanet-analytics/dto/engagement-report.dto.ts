// src/engagement-analytics/dto/engagement-report.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export enum ReportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf'
}

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export class EngagementReportDto {
  @IsNotEmpty()
  @IsEnum(ReportType)
  type: ReportType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;

  @IsOptional()
  @IsString()
  title?: string;
}

