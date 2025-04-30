import { InjectRepository } from "@nestjs/typeorm";
import { ForumReport } from "./entities/forum-report.entity";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ForumReportService {
  constructor(
    @InjectRepository(ForumReport) //repo injection forum-report entity
    private readonly reportRepo: Repository<ForumReport>,
  ) {}

  public async getOpenReports() {
    return this.reportRepo.find({ 
      where: { resolved: false }, 
      order: { createdAt: 'DESC' } 
    });
  }
}
