import { Test, TestingModule } from '@nestjs/testing';
import { SignalAuditController } from './signal-audit.controller';

describe('SignalAuditController', () => {
  let controller: SignalAuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalAuditController],
    }).compile();

    controller = module.get<SignalAuditController>(SignalAuditController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
