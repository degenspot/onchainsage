"use client"

import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type TrendingToken = {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  volume: number
  marketCap: number
  socialScore: number
}

const trendingTokens: TrendingToken[] = [
  {
    id: "1",
    name: "Bitcoin",
    symbol: "BTC",
    price: 73500,
    change: 2.4,
    volume: 32000000000,
    marketCap: 1450000000000,
    socialScore: 92,
  },
  {
    id: "2",
    name: "Ethereum",
    symbol: "ETH",
    price: 4200,
    change: 3.1,
    volume: 18000000000,
    marketCap: 505000000000,
    socialScore: 88,
  },
  {
    id: "3",
    name: "Solana",
    symbol: "SOL",
    price: 168,
    change: 5.2,
    volume: 6500000000,
    marketCap: 72000000000,
    socialScore: 85,
  },
  {
    id: "4",
    name: "Avalanche",
    symbol: "AVAX",
    price: 42.5,
    change: 1.8,
    volume: 1200000000,
    marketCap: 15000000000,
    socialScore: 78,
  },
  {
    id: "5",
    name: "Chainlink",
    symbol: "LINK",
    price: 18.75,
    change: 2.8,
    volume: 950000000,
    marketCap: 11000000000,
    socialScore: 75,
  },
]

export function TrendingTokens() {
  return (
    <div className="space-y-4">
      {trendingTokens.map((token) => (
        <div
          key={token.id}
          className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0 transition-all-200 hover:bg-muted/30 p-2 rounded-md -mx-2"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform-200 group-hover:scale-110">
              {token.symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{token.name}</span>
                <span className="text-xs text-muted-foreground">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>${token.price.toLocaleString()}</span>
                <span className={`flex items-center ${token.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {token.change >= 0 ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                  {Math.abs(token.change)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge className="mb-1 transition-all-200">Social Score: {token.socialScore}</Badge>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs transition-all-200 hover:bg-primary/10">
              <span>View</span>
              <ExternalLink className="h-3 w-3 transition-transform-200 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

