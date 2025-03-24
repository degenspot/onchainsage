import { MockSignalService } from './mock-signals.service';
import { TradingSignal } from 'src/interfaces/trading-signal.interface';

describe('MockSignalService', () => {
  let service: MockSignalService;

  beforeEach(() => {
    service = new MockSignalService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an array of mock trading signals', () => {
    const signals: TradingSignal[] = service.generateMockSignals();

    expect(signals).toBeInstanceOf(Array);
    expect(signals.length).toBe(5);

    signals.forEach((signal, index) => {
      expect(signal.signal_id).toBeDefined();
      expect(signal.timestamp).toBeDefined();
      expect(signal.token_pair).toBeDefined();
      expect(signal.sentiment_score).toBeGreaterThanOrEqual(-1);
      expect(signal.sentiment_score).toBeLessThanOrEqual(1);
      expect(signal.liquidity_usd).toBeGreaterThanOrEqual(500000);
      expect(signal.liquidity_usd).toBeLessThanOrEqual(5500000);
      expect(signal.volume_usd).toBeGreaterThanOrEqual(100000);
      expect(signal.volume_usd).toBeLessThanOrEqual(1100000);
      expect(signal.category).toMatch(
        /high-confidence|medium-confidence|low-confidence/,
      );
      expect(signal.recommendation).toMatch(/buy|sell|hold/);
    });
  });
});
