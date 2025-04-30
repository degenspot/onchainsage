import { Module } from '@nestjs/common';
import { ForumReportService } from './forum-report.service';
import { ForumReportController } from './forum-report.controller';

@Module({
  controllers: [ForumReportController],
  providers: [ForumReportService],
})
export class ForumReportModule {}
