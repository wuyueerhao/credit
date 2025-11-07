"use client"

import { Area, AreaChart, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { date: "10-28", total: 0 },
  { date: "10-29", total: 99 },
  { date: "10-30", total: 20 },
  { date: "10-31", total: 90 },
  { date: "11-01", total: 20 },
  { date: "11-02", total: 100 },
  { date: "11-03", total: 200 },
  { date: "11-04", total: 0.01 },
  { date: "11-05", total: 0 },
]

const chartConfig = {
  total: {
    label: "总额",
    color: "hsl(217, 91%, 60%)",
  },
} satisfies ChartConfig

export function DataPanel() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2">
          <div className="mb-2">
            <h3 className="text-sm text-muted-foreground font-medium">总额</h3>
          </div>
          
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <AreaChart
              data={chartData}
              margin={{
                left: 6,
                right: 6,
                top: 12,
                bottom: 12,
              }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                hide
              />
              <YAxis
                hide
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey="total"
                type="monotone"
                fill="url(#colorTotal)"
                stroke="var(--color-total)"
                strokeWidth={1}
                dot={{
                  fill: "hsl(217, 91%, 60%)",
                  stroke: "hsl(217, 91%, 60%)",
                  strokeWidth: 3,
                  r: 1,
                }}
                activeDot={{
                  fill: "hsl(217, 91%, 60%)",
                  stroke: "hsl(217, 91%, 60%)",
                  strokeWidth: 3,
                  r: 2,
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        
        <div className="col-span-1 flex flex-col">
          <div className="flex-1 border-b pb-4">
            <div className="text-sm text-muted-foreground font-medium">Linux Do Credit</div>
            <div>—</div>
          </div>
          
          <div className="flex-1 pt-4">
            <div className="text-sm text-muted-foreground font-medium">今日剩余额度</div>
            <div>—</div>
          </div>
        </div>
      </div>
    </div>
  )
}

