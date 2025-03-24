import { Test, TestingModule } from '@nestjs/testing';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { MockSignalService } from './mock-signals.service';

describe('SignalsController', () => {
  let controller: SignalsController;
  let signalsService: Partial<SignalsService>;
  let mockSignalsService: Partial<MockSignalService>;

  beforeEach(async () => {
    signalsService = {
      findAll: jest.fn().mockReturnValue([
        { id: '1', symbol: 'BTC/USD', price: 50000 },
        { id: '2', symbol: 'ETH/USD', price: 2500 },
      ]),
    };

    mockSignalsService = {
      generateMockSignals: jest
        .fn()
        .mockReturnValue([{ id: 'mock_1', symbol: 'SOL/USD', price: 100 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalsController],
      providers: [
        { provide: SignalsService, useValue: signalsService },
        { provide: MockSignalService, useValue: mockSignalsService },
      ],
    }).compile();

    controller = module.get<SignalsController>(SignalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all trading signals', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([
      { id: '1', symbol: 'BTC/USD', price: 50000 },
      { id: '2', symbol: 'ETH/USD', price: 2500 },
    ]);
    expect(signalsService.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return mock signals', async () => {
    const result = await controller.getMockSignals();
    expect(result).toEqual([{ id: 'mock_1', symbol: 'SOL/USD', price: 100 }]);
    expect(mockSignalsService.generateMockSignals).toHaveBeenCalledTimes(1);
  });
});
