"use client"

import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

import { Button } from "@/components/ui/button"

const priceData = [
  { date: "Mar 15", BTC: 68500, ETH: 3800, SOL: 145 },
  { date: "Mar 16", BTC: 67200, ETH: 3750, SOL: 142 },
  { date: "Mar 17", BTC: 69800, ETH: 3900, SOL: 152 },
  { date: "Mar 18", BTC: 71200, ETH: 4050, SOL: 158 },
  { date: "Mar 19", BTC: 70500, ETH: 3980, SOL: 155 },
  { date: "Mar 20", BTC: 72800, ETH: 4120, SOL: 162 },
  { date: "Mar 21", BTC: 73500, ETH: 4200, SOL: 168 },
]

const volumeData = [
  { date: "Mar 15", BTC: 32, ETH: 18, SOL: 12 },
  { date: "Mar 16", BTC: 28, ETH: 16, SOL: 10 },
  { date: "Mar 17", BTC: 35, ETH: 20, SOL: 14 },
  { date: "Mar 18", BTC: 42, ETH: 24, SOL: 18 },
  { date: "Mar 19", BTC: 38, ETH: 22, SOL: 15 },
  { date: "Mar 20", BTC: 45, ETH: 26, SOL: 20 },
  { date: "Mar 21", BTC: 48, ETH: 28, SOL: 22 },
]

export function DashboardChart() {
  const [chartType, setChartType] = useState<"price" | "volume">("price")
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d")

  const data = chartType === "price" ? priceData : volumeData

  /* Improve chart responsiveness */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={chartType === "price" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("price")}
            className="transition-all-200"
          >
            Price
          </Button>
          <Button
            variant={chartType === "volume" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("volume")}
            className="transition-all-200"
          >
            Volume
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("7d")}
            className="transition-all-200"
          >
            7D
          </Button>
          <Button
            variant={timeRange === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("30d")}
            className="transition-all-200"
          >
            30D
          </Button>
          <Button
            variant={timeRange === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("90d")}
            className="transition-all-200"
          >
            90D
          </Button>
        </div>
      </div>

      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "price" ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBTC" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f7931a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f7931a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorETH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#627eea" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#627eea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSOL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffbd" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00ffbd" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey="BTC"
                stroke="#f7931a"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBTC)"
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="ETH"
                stroke="#627eea"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorETH)"
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="SOL"
                stroke="#00ffbd"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSOL)"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  color: "#fff",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <Bar dataKey="BTC" fill="#f7931a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ETH" fill="#627eea" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SOL" fill="#00ffbd" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

