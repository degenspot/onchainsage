import { Test, TestingModule } from '@nestjs/testing';
import { SignalsService } from './signals.service';

describe('SignalsService', () => {
  let service: SignalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignalsService],
    }).compile();

    service = module.get<SignalsService>(SignalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
