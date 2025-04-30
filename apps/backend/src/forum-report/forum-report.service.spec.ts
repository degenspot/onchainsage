import { Test, TestingModule } from '@nestjs/testing';
import { ForumReportService } from './forum-report.service';

describe('ForumReportService', () => {
  let service: ForumReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForumReportService],
    }).compile();

    service = module.get<ForumReportService>(ForumReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
