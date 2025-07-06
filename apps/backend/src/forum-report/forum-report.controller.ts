import { Controller } from '@nestjs/common';
import { ForumReportService } from './forum-report.service';

@Controller('forum-report')
export class ForumReportController {
  constructor(private readonly forumReportService: ForumReportService) {}
}
