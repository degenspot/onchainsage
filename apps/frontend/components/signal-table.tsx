"use client"

import { ArrowDown, ArrowUp, ArrowUpRight, CircleAlert, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Signal = {
  id: string
  token: string
  pair: string
  price: number
  change: number
  sentiment: number
  confidence: "high" | "emerging" | "risky"
  timestamp: string
}

const signals: Signal[] = [
  {
    id: "1",
    token: "BTC",
    pair: "BTC/USDT",
    price: 73500,
    change: 2.4,
    sentiment: 78,
    confidence: "high",
    timestamp: "2025-03-21 14:32:45",
  },
  {
    id: "2",
    token: "ETH",
    pair: "ETH/USDT",
    price: 4200,
    change: 3.1,
    sentiment: 82,
    confidence: "high",
    timestamp: "2025-03-21 14:30:12",
  },
  {
    id: "3",
    token: "SOL",
    pair: "SOL/USDT",
    price: 168,
    change: 5.2,
    sentiment: 75,
    confidence: "high",
    timestamp: "2025-03-21 14:28:33",
  },
  {
    id: "4",
    token: "AVAX",
    pair: "AVAX/USDT",
    price: 42.5,
    change: 1.8,
    sentiment: 65,
    confidence: "emerging",
    timestamp: "2025-03-21 14:25:18",
  },
  {
    id: "5",
    token: "MATIC",
    pair: "MATIC/USDT",
    price: 0.85,
    change: -1.2,
    sentiment: 45,
    confidence: "risky",
    timestamp: "2025-03-21 14:22:05",
  },
  {
    id: "6",
    token: "LINK",
    pair: "LINK/USDT",
    price: 18.75,
    change: 2.8,
    sentiment: 68,
    confidence: "emerging",
    timestamp: "2025-03-21 14:20:42",
  },
  {
    id: "7",
    token: "DOT",
    pair: "DOT/USDT",
    price: 8.95,
    change: -0.5,
    sentiment: 52,
    confidence: "emerging",
    timestamp: "2025-03-21 14:18:19",
  },
  {
    id: "8",
    token: "ADA",
    pair: "ADA/USDT",
    price: 0.58,
    change: 1.2,
    sentiment: 60,
    confidence: "emerging",
    timestamp: "2025-03-21 14:15:37",
  },
]

type SignalTableProps = {
  category?: "high" | "emerging" | "risky"
}

export function SignalTable({ category }: SignalTableProps) {
  const filteredSignals = category ? signals.filter((signal) => signal.confidence === category) : signals

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Pair</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead>Sentiment</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSignals.map((signal) => (
            <TableRow key={signal.id}>
              <TableCell className="font-medium">{signal.token}</TableCell>
              <TableCell>{signal.pair}</TableCell>
              <TableCell>${signal.price.toLocaleString()}</TableCell>
              <TableCell>
                <div className={`flex items-center ${signal.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {signal.change >= 0 ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                  {Math.abs(signal.change)}%
                </div>
              </TableCell>
              <TableCell>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${
                      signal.sentiment > 70 ? "bg-green-500" : signal.sentiment > 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${signal.sentiment}%` }}
                  ></div>
                </div>
                <span className="text-xs">{signal.sentiment}%</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    signal.confidence === "high"
                      ? "default"
                      : signal.confidence === "emerging"
                        ? "secondary"
                        : "destructive"
                  }
                  className="capitalize"
                >
                  {signal.confidence === "high" && <Zap className="mr-1 h-3 w-3" />}
                  {signal.confidence === "emerging" && <ArrowUpRight className="mr-1 h-3 w-3" />}
                  {signal.confidence === "risky" && <CircleAlert className="mr-1 h-3 w-3" />}
                  {signal.confidence}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  View Details
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

