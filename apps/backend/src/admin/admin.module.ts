import { Module } from '@nestjs/common';
import { AdminService } from './providers/admin.service';
import { AdminController } from './admin.controller';
import { ForumReportService } from 'src/forum-report/forum-report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumReport } from '../forum-report/entities/forum-report.entity';
import { ModerationService } from './providers/moderation.service';
import { AuditLogService } from './audit-log/audit-log.service';
import { User } from '../users/entities/user.entity';
import { Post } from '../forum_module/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, ForumReport])],
  controllers: [AdminController],
  providers: [
    AdminService, 
    ForumReportService, 
    ModerationService, 
    AuditLogService
  ],
  exports: [AdminService]
})
export class AdminModule {}
