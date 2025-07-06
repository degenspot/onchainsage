// src/engagement-analytics/controllers/engagement-reporting.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EngagementReportingService } from '../services/engagement-reporting.service';
import {
  EngagementReportDto,
  ReportFormat,
} from '../dto/engagement-report.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@ApiTags('engagement-reporting')
@Controller('engagement-reporting')
export class EngagementReportingController {
  private readonly logger = new Logger(EngagementReportingController.name);

  constructor(private readonly reportingService: EngagementReportingService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Generate an engagement report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiBody({ type: EngagementReportDto })
  async generateReport(
    @Body() reportDto: EngagementReportDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const report = await this.reportingService.generateReport(reportDto);

      // Set appropriate headers based on report format
      switch (reportDto.format) {
        case ReportFormat.CSV:
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="engagement_report.csv"`,
          );
          break;
        case ReportFormat.PDF:
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="engagement_report.pdf"`,
          );
          break;
        default:
          res.setHeader('Content-Type', 'application/json');
          break;
      }

      // Send the report as the response
      res.send(report);
    } catch (error) {
      this.logger.error(
        `Failed to generate report: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to generate report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get list of available reports' })
  @ApiResponse({
    status: 200,
    description: 'Reports list retrieved successfully',
  })
  async getAvailableReports(): Promise<{ reports: string[] }> {
    try {
      const reports = await this.reportingService.getAvailableReports();
      return { reports };
    } catch (error) {
      this.logger.error(
        `Failed to get available reports: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to retrieve reports list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
