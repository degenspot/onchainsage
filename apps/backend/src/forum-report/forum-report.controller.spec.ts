import { Test, TestingModule } from '@nestjs/testing';
import { ForumReportController } from './forum-report.controller';
import { ForumReportService } from './forum-report.service';

describe('ForumReportController', () => {
  let controller: ForumReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumReportController],
      providers: [ForumReportService],
    }).compile();

    controller = module.get<ForumReportController>(ForumReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
