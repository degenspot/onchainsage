import { Test, TestingModule } from '@nestjs/testing';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';

describe('SignalsController', () => {
  let controller: SignalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalsController],
      providers: [SignalsService],
    }).compile();

    controller = module.get<SignalsController>(SignalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
