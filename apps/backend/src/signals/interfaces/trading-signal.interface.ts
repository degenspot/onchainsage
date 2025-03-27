export interface TradingSignal {
    signal_id: string
    timestamp: string
    token_pair: string
    sentiment_score: number
    liquidity_usd: number
    volume_usd: number
    category: string
    thesis: string
    recommendation: string
  }
  