import { Test, TestingModule } from '@nestjs/testing';
import { MockSignalsService } from '../../../signals/mock-signals.service';

describe('MockSignalsService', () => {
  let service: MockSignalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockSignalsService],
    }).compile();

    service = module.get<MockSignalsService>(MockSignalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
