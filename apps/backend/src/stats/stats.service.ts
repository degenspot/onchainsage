import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ForumReport } from "src/forum-report/entities/forum-report.entity";
import { User } from "src/users/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(ForumReport) private reportRepo: Repository<ForumReport>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  public async getSystemStats(query: { from?: string; to?: string }) {
    const { from, to } = query;
    const filter: any = {};

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt['$gte'] = new Date(from);
      if (to) filter.createdAt['$lte'] = new Date(to);
    }

    const [totalPosts, totalReports, totalUsers] = await Promise.all([
      this.postRepo.count({ where: filter }),
      this.reportRepo.count({ where: filter }),
      this.userRepo.count(),
    ]);

    return {
      totalPosts,
      totalReports,
      totalUsers,
    };
  }
}

