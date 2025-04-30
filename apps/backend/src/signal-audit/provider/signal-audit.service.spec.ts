import { Test, TestingModule } from '@nestjs/testing';
import { SignalAuditService } from './signal-audit.service';

describe('SignalAuditService', () => {
  let service: SignalAuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignalAuditService],
    }).compile();

    service = module.get<SignalAuditService>(SignalAuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
