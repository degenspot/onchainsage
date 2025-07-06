import { Test, TestingModule } from '@nestjs/testing';
import { SignalsService } from './signals.service';

describe('SignalsService', () => {
  let service: SignalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalsService,
        {
          provide: 'SignalRepository',
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 1, value: 'test-signal' }),
            save: jest.fn().mockResolvedValue({ id: 1, value: 'test-signal' }),
          },
        },
      ],
    }).compile();

    service = module.get<SignalsService>(SignalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
