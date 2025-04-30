/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { SpamFilterService } from './spam-filter/spam-filter.service';
import { Thread } from './entities/thread.entity';
import { Post } from './entities/post.entity';
import { Reply } from './entities/reply.entity';
import { Report } from './entities/report.entity';
import { Reaction } from './entities/reaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Thread, Post, Reply, Report, Reaction]),
  ],
  providers: [ForumService, SpamFilterService],
  controllers: [ForumController],
})
export class ForumModule {}
