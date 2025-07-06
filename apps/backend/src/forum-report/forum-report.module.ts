import { Module } from '@nestjs/common';
import { ForumReportService } from './forum-report.service';
import { ForumReportController } from './forum-report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumReport } from './entities/forum-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForumReport])],
  controllers: [ForumReportController],
  providers: [ForumReportService],
})
export class ForumReportModule {}
