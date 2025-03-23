import { Test, TestingModule } from '@nestjs/testing';
import { MockSignalService } from './mock-signals.service';

describe('MockSignalsService', () => {
  let service: MockSignalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockSignalService],
    }).compile();

    service = module.get<MockSignalService>(MockSignalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
