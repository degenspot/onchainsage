import { Test, TestingModule } from '@nestjs/testing';
import { ForumService } from './forum.service';
import { SpamFilterService } from './spam-filter/spam-filter.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Thread } from './entities/thread.entity';
import { Post } from './entities/post.entity';
import { Reply } from './entities/reply.entity';
import { Report } from './entities/report.entity';
import { Reaction } from './entities/reaction.entity';

describe('ForumService', () => {
  let svc: ForumService;

  const fakeRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumService,
        SpamFilterService,
        { provide: getRepositoryToken(Thread), useFactory: fakeRepo },
        { provide: getRepositoryToken(Post), useFactory: fakeRepo },
        { provide: getRepositoryToken(Reply), useFactory: fakeRepo },
        { provide: getRepositoryToken(Report), useFactory: fakeRepo },
        { provide: getRepositoryToken(Reaction), useFactory: fakeRepo },
      ],
    }).compile();

    svc = module.get<ForumService>(ForumService);
  });

  it('should be defined', () => {
    expect(svc).toBeDefined();
  });
});
