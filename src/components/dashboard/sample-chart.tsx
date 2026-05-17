"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Enero", sales: 186, mobile: 80 },
  { month: "Febrero", sales: 305, mobile: 200 },
  { month: "Marzo", sales: 237, mobile: 120 },
  { month: "Abril", sales: 73, mobile: 190 },
  { month: "Mayo", sales: 209, mobile: 130 },
  { month: "Junio", sales: 214, mobile: 140 },
]

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
  mobile: {
    label: "Móvil",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function SampleSalesChart() {
  return (
    <Card className="rounded-3xl border shadow-sm bg-background">
      <CardHeader>
        <CardTitle className="text-xl font-black">Rendimiento Mensual</CardTitle>
        <CardDescription>Enero - Junio 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="sales" fill="var(--color-sales)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-bold leading-none italic">
          Tendencia al alza del 5.2% este mes <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="leading-none text-muted-foreground italic text-xs">
          * Datos simulados para verificación del tema SaaS.
        </div>
      </CardFooter>
    </Card>
  )
}
