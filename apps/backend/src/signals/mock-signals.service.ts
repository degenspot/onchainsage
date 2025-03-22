import { Injectable, NotFoundException } from "@nestjs/common"
import { TradingSignal } from "src/interfaces/trading-signal.interface"
@Injectable()
export class MockSignalService {
  private signals: TradingSignal[]

  constructor() {
    this.signals = this.generateMockSignals()
  }
  
  generateMockSignals(): TradingSignal[] {
    const tokenPairs = ["BTC/USD", "ETH/USD", "SOL/USD", "AVAX/USD", "DOT/USD"]
    const categories = ["high-confidence", "medium-confidence", "low-confidence"]
    const recommendations = ["buy", "sell", "hold"]

    return Array.from({ length: 5 }, (_, i) => {
      // Generate a random date within the last week
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 7))

      return {
        signal_id: `sig_mock_00${i + 1}`,
        timestamp: date.toISOString(),
        token_pair: tokenPairs[Math.floor(Math.random() * tokenPairs.length)],
        sentiment_score: Number.parseFloat((Math.random() * 2 - 1).toFixed(2)), // Range from -1 to 1
        liquidity_usd: Math.floor(Math.random() * 5000000) + 500000, // Range from 500K to 5.5M
        volume_usd: Math.floor(Math.random() * 1000000) + 100000, // Range from 100K to 1.1M
        category: categories[Math.floor(Math.random() * categories.length)],
        thesis: `This is a mock thesis for signal ${i + 1}. The market conditions suggest this action based on technical analysis and market sentiment.`,
        recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
      }
    })
  }

  getMockSignalById(id: string): TradingSignal {
    const signal = this.signals.find(signal => signal.signal_id === id)
    if (!signal) {
      throw new NotFoundException(`Signal with ID ${id} not found`)
    }
    return signal
  }
}

