import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { ForumReportService } from 'src/forum-report/forum-report.service';
import { ModerationService } from './providers/moderation.service';
import { StatsService } from '../stats/stats.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly reportService: ForumReportService,
    private readonly moderationService: ModerationService,
    private readonly statsService: StatsService,
  ) {}

  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.Moderator)
  public async getReports() {
    return await this.reportService.getOpenReports();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.Moderator)
  public async getStats(@Query() query) {
    return await this.statsService.getSystemStats(query);
  }

  @Post('post/:id/ban')
  @Roles(UserRole.ADMIN, UserRole.Moderator)
  public async banPost(@Param('id') postId: string, @Req() req) {
    return await this.moderationService.banPost(postId, req.user.wallet);
  }

  @Patch('user/:wallet/shadowban')
  @Roles(UserRole.ADMIN, UserRole.Moderator)
  public async shadowbanUser(@Param('wallet') wallet: string, @Req() req) {
    return await this.moderationService.shadowbanUser(wallet, req.user.wallet);
  }
}
