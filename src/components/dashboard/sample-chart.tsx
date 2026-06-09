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

export interface SalesChartItem {
  month: string;
  sales: number;
}

interface SampleSalesChartProps {
  data: SalesChartItem[];
}

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function SampleSalesChart({ data }: SampleSalesChartProps) {
  const totalThisMonth = data[data.length - 1]?.sales || 0;
  const totalLastMonth = data[data.length - 2]?.sales || 0;
  const diffPercent = totalLastMonth > 0 
    ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 
    : 0;

  return (
    <Card className="rounded-3xl border shadow-sm bg-background">
      <CardHeader>
        <CardTitle className="text-xl font-black">Rendimiento Mensual</CardTitle>
        <CardDescription>Últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
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
        {diffPercent > 0 ? (
          <div className="flex gap-2 font-bold leading-none italic text-green-600 dark:text-green-400">
            Crecimiento del {diffPercent.toFixed(1)}% este mes vs anterior <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        ) : (
          <div className="flex gap-2 font-bold leading-none italic text-muted-foreground">
            Monitoreo en tiempo real de ingresos
          </div>
        )}
        <div className="leading-none text-muted-foreground italic text-xs">
          * Datos reales de ventas de la sucursal activa.
        </div>
      </CardFooter>
    </Card>
  )
}
