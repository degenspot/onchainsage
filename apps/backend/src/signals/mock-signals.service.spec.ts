import { MockSignalService } from './mock-signals.service';
import { Signal } from './entities/signal.entity';

describe('MockSignalService', () => {
  let service: MockSignalService;

  beforeEach(() => {
    service = new MockSignalService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an array of mock signals', () => {
    const result = service.generateMockSignals();
    const signals: Signal[] = result.data;

    expect(result.total).toBe(50);
    expect(signals).toBeInstanceOf(Array);
    expect(signals.length).toBe(10); // Default page size

    signals.forEach((signal) => {
      expect(signal.signal_id).toBeDefined();
      expect(signal.timestamp).toBeDefined();
      expect(signal.signal_type).toBeDefined();
      expect(signal.value).toBeDefined();
      expect(signal.status).toBeDefined();
      expect(signal.confidence_level).toBeDefined();
    });
  });
});
