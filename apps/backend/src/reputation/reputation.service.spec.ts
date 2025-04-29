import { Test, TestingModule } from '@nestjs/testing';
import { ReputationService } from './reputation.service';

describe('ReputationService', () => {
  let service: ReputationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReputationService],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
