import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Get,
  SetMetadata,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ForumService } from './forum.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { ReportPostDto } from './dto/report-post.dto';
import { AdminGuard } from './guards/admin.guard';

@Controller('forum')
@UseGuards(ThrottlerGuard)
export class ForumController {
  constructor(private readonly svc: ForumService) {}

  @Post(':signalId/thread')
  @UseGuards(ThrottlerGuard)
  @SetMetadata('throttler-limit', 5)
  @SetMetadata('throttler-ttl', 3600) // 1-hour window
  createThread(
    @Param('signalId') signalId: string,
    @Body() dto: CreateThreadDto,
    @Request() req,
  ) {
    return this.svc.createThread(signalId, req.user.id, dto.content);
  }

  @Post(':threadId/reply')
  @UseGuards(ThrottlerGuard)
  @SetMetadata('throttler-limit', 10)
  @SetMetadata('throttler-ttl', 3600)
  createReply(
    @Param('threadId') threadId: string,
    @Body() dto: CreateReplyDto,
    @Request() req,
  ) {
    return this.svc.createReply(threadId, req.user.id, dto.content);
  }

  @Post(':postId/report')
  report(
    @Param('postId') postId: string,
    @Body() dto: ReportPostDto,
    @Request() req,
  ) {
    return this.svc.reportPost(postId, req.user.id, dto.reason);
  }

  @Get('reports')
  @UseGuards(AdminGuard)
  listReports() {
    return this.svc.listReports();
  }
}
