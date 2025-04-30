import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Thread } from './entities/thread.entity';
import { Post } from './entities/post.entity';
import { Reply } from './entities/reply.entity';
import { Report } from './entities/report.entity';
import { Reaction } from './entities/reaction.entity';
import { SpamFilterService } from './spam-filter/spam-filter.service';

@Injectable()
export class ForumService {
  constructor(
    @InjectRepository(Thread) private threads: Repository<Thread>,
    @InjectRepository(Post) private posts: Repository<Post>,
    @InjectRepository(Reply) private replies: Repository<Reply>,
    @InjectRepository(Report) private reports: Repository<Report>,
    @InjectRepository(Reaction) private reactions: Repository<Reaction>,
    private spam: SpamFilterService,
  ) {}

  async createThread(signalId: string, userId: string, content: string) {
    const spamScore = this.spam.score(content);

    const thread = this.threads.create({ signalId });
    thread.posts = [];

    const post = this.posts.create({
      thread,
      author: { id: userId } as any,
      content,
      spamScore,
      hidden: spamScore > 0.7,
    });

    thread.posts.push(post);
    return this.threads.save(thread);
  }

  async createReply(threadId: string, userId: string, content: string) {
    const thread = await this.threads.findOne({
      where: { id: threadId },
      relations: ['posts'],
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const spamScore = this.spam.score(content);
    const parentPost = thread.posts[0]; // Assumes first post is thread starter

    const reply = this.replies.create({
      post: parentPost,
      author: { id: userId } as any,
      content,
      spamScore,
      hidden: spamScore > 0.7,
    });

    return this.replies.save(reply);
  }

  async reportPost(postId: string, userId: string, reason: string) {
    const post = await this.posts.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const report = this.reports.create({
      post,
      reporter: { id: userId } as any,
      reason,
    });

    return this.reports.save(report);
  }

  async listReports() {
    return this.reports.find({
      relations: ['post', 'reply', 'reporter'],
      order: { createdAt: 'DESC' },
    });
  }
}
