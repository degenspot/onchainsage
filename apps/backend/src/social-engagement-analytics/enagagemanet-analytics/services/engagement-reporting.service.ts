// src/engagement-analytics/services/engagement-reporting.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EngagementAnalyticsService } from './engagement-analytics.service';
import {
  EngagementReportDto,
  ReportFormat,
  ReportType,
} from '../dto/engagement-report.dto';
import { EngagementQueryDto, TimeFrame } from '../dto/engagement-query.dto';
import { EngagementSummary } from '../interfaces/engagement-analytics.interface';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import * as fs from 'fs';
import * as path from 'path';
import { createObjectCsvStringifier } from 'csv-writer';

@Injectable()
export class EngagementReportingService {
  private readonly logger = new Logger(EngagementReportingService.name);
  private readonly reportsDir = path.join(process.cwd(), 'reports');

  constructor(
    private readonly analyticsService: EngagementAnalyticsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }

    // Set up scheduled reports
    this.setupScheduledReports();
  }

  /**
   * Generate a report based on the provided parameters
   */
  async generateReport(
    reportDto: EngagementReportDto,
  ): Promise<string | Buffer> {
    const { type, startDate, endDate, format } = reportDto;

    // Create a query DTO for the analytics service
    const queryDto: EngagementQueryDto = {
      timeFrame: this.getTimeFrameFromReportType(type),
      startDate,
      endDate,
    };

    // Get the analytics data
    const analyticsData =
      await this.analyticsService.getEngagementAnalytics(queryDto);

    // Format the data according to the requested format
    return this.formatReport(analyticsData, format, reportDto.title);
  }

  /**
   * Schedule the generation and delivery of periodic reports
   */
  private setupScheduledReports(): void {
    // Daily report at midnight
    const dailyJob = new CronJob('0 0 * * *', () => {
      this.logger.log('Generating daily engagement report');
      this.generateAndDeliverScheduledReport(ReportType.DAILY);
    });

    // Weekly report on Mondays at 1am
    const weeklyJob = new CronJob('0 1 * * 1', () => {
      this.logger.log('Generating weekly engagement report');
      this.generateAndDeliverScheduledReport(ReportType.WEEKLY);
    });

    // Monthly report on the 1st of each month at 2am
    const monthlyJob = new CronJob('0 2 1 * *', () => {
      this.logger.log('Generating monthly engagement report');
      this.generateAndDeliverScheduledReport(ReportType.MONTHLY);
    });

    // Register the cron jobs
    this.schedulerRegistry.addCronJob('dailyEngagementReport', dailyJob);
    this.schedulerRegistry.addCronJob('weeklyEngagementReport', weeklyJob);
    this.schedulerRegistry.addCronJob('monthlyEngagementReport', monthlyJob);

    // Start the jobs
    dailyJob.start();
    weeklyJob.start();
    monthlyJob.start();
  }

  /**
   * Generate and deliver a scheduled report
   */
  private async generateAndDeliverScheduledReport(
    reportType: ReportType,
  ): Promise<void> {
    try {
      const reportDto: EngagementReportDto = {
        type: reportType,
        format: ReportFormat.PDF,
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Engagement Report`,
      };

      const report = await this.generateReport(reportDto);

      // Save the report to the file system
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${reportDto.type}_report_${timestamp}.${this.getFileExtension(reportDto.format)}`;
      const filepath = path.join(this.reportsDir, filename);

      fs.writeFileSync(filepath, report);

      this.logger.log(`Report saved to ${filepath}`);

      // In a production environment, you would also send the report via email or upload to storage
      await this.deliverReport(filepath, reportDto);
    } catch (error) {
      this.logger.error(
        `Failed to generate scheduled report: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Format the report data according to the requested format
   */
  private formatReport(
    data: EngagementSummary,
    format: ReportFormat,
    title?: string,
  ): string | Buffer {
    switch (format) {
      case ReportFormat.JSON:
        return JSON.stringify(data, null, 2);

      case ReportFormat.CSV:
        return this.formatCsvReport(data);

      case ReportFormat.PDF:
        return this.formatPdfReport(data, title);

      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Format the report as CSV
   */
  private formatCsvReport(data: EngagementSummary): string {
    // Format time series data for CSV
    const records = data.trendData.flatMap((point) => {
      return point.engagements.map((engagement) => ({
        timestamp: point.timestamp.toISOString(),
        type: engagement.type,
        count: engagement.count,
        weightedScore: engagement.weightedScore,
      }));
    });

    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'type', title: 'Engagement Type' },
        { id: 'count', title: 'Count' },
        { id: 'weightedScore', title: 'Weighted Score' },
      ],
    });

    // Generate CSV
    const header = csvStringifier.getHeaderString();
    const rows = csvStringifier.stringifyRecords(records);

    return header + rows;
  }

  /**
   * Format the report as PDF
   * In a production environment, this would use a PDF generation library like PDFKit
   */
  private formatPdfReport(data: EngagementSummary, title?: string): Buffer {
    // This is a placeholder. In a real implementation, you would use a PDF library
    // For now, we'll return a JSON string as a buffer for demonstration purposes
    const reportTitle = title || 'Engagement Analytics Report';
    const jsonData = JSON.stringify(
      {
        title: reportTitle,
        generatedAt: new Date().toISOString(),
        period: {
          start: data.period.start.toISOString(),
          end: data.period.end.toISOString(),
        },
        summary: {
          totalEngagements: data.totalEngagements,
          sentimentScore: data.sentimentScore,
          engagementsByType: data.engagementsByType,
        },
        // Include other data as needed
      },
      null,
      2,
    );

    return Buffer.from(jsonData);
  }

  /**
   * Get the file extension based on report format
   */
  private getFileExtension(format: ReportFormat): string {
    switch (format) {
      case ReportFormat.JSON:
        return 'json';
      case ReportFormat.CSV:
        return 'csv';
      case ReportFormat.PDF:
        return 'pdf';
      default:
        return 'txt';
    }
  }

  /**
   * Deliver the report to configured destinations (email, cloud storage, etc.)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async deliverReport(
    filepath: string,
    _reportDto: EngagementReportDto,
  ): Promise<void> {
    this.logger.log(`Report delivered: ${filepath}`);
    // Placeholder for actual delivery logic (e.g., email service, S3 upload)
  }

  /**
   * Get list of available generated reports
   */
  async getAvailableReports(): Promise<string[]> {
    try {
      // Read the report directory
      const files = fs.readdirSync(this.reportsDir);

      // Return only report files
      return files.filter(
        (file) =>
          file.endsWith('.json') ||
          file.endsWith('.csv') ||
          file.endsWith('.pdf'),
      );
    } catch (error) {
      this.logger.error(`Failed to read reports directory: ${error.message}`);
      return [];
    }
  }

  private getTimeFrameFromReportType(reportType: ReportType): TimeFrame {
    switch (reportType) {
      case ReportType.DAILY:
        return TimeFrame.DAY;
      case ReportType.WEEKLY:
        return TimeFrame.WEEK;
      case ReportType.MONTHLY:
        return TimeFrame.MONTH;
      default:
        return TimeFrame.CUSTOM;
    }
  }
}
