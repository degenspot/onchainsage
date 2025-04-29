import { Test, TestingModule } from '@nestjs/testing';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';

describe('ReputationController', () => {
  let controller: ReputationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReputationController],
      providers: [ReputationService],
    }).compile();

    controller = module.get<ReputationController>(ReputationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
