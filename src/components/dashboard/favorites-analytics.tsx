"use client"

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis } from "recharts"

interface FavoriteStats {
  totalFavorites: number
  thisWeekFavorites: number
  mostFavorited: { product_id: string; product_name: string; favorite_count: number }[]
  favoritesByDay: { date: string; count: number }[]
}

interface FavoritesAnalyticsProps {
  stats: FavoriteStats
  productCount: number
}

export function FavoritesAnalytics({ stats, productCount }: FavoritesAnalyticsProps) {
  const conversionRate = productCount > 0 
    ? Math.round((stats.totalFavorites / productCount) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Total Favoritos</span>
          <p className="text-3xl font-black mt-1">{stats.totalFavorites}</p>
        </div>
        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Esta Semana</span>
          <p className="text-3xl font-black mt-1 text-emerald-600">{stats.thisWeekFavorites}</p>
        </div>
        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Producto #1</span>
          <p className="text-lg font-black mt-1 truncate">
            {stats.mostFavorited[0]?.product_name || "—"}
          </p>
          <span className="text-xs text-muted-foreground font-bold">
            {stats.mostFavorited[0]?.favorite_count || 0} favoritos
          </span>
        </div>
        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <span className="text-sm font-bold text-muted-foreground">Tasa de Interes</span>
          <p className="text-3xl font-black mt-1 text-orange-500">{conversionRate}%</p>
          <span className="text-xs text-muted-foreground font-bold">favoritos vs productos</span>
        </div>
      </div>

      {/* Top 10 Products Table */}
      <div className="rounded-3xl border bg-background p-6 shadow-sm">
        <h3 className="text-lg font-black mb-4">Top 10 Productos mas Favoritos</h3>
        {stats.mostFavorited.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No hay datos de favoritos todavia.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-bold text-muted-foreground text-xs uppercase tracking-wider">#</th>
                  <th className="pb-2 font-bold text-muted-foreground text-xs uppercase tracking-wider">Producto</th>
                  <th className="pb-2 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right">Favoritos</th>
                </tr>
              </thead>
              <tbody>
                {stats.mostFavorited.map((item, i) => (
                  <tr key={item.product_id} className="border-b last:border-0">
                    <td className="py-2.5 font-bold">{i + 1}</td>
                    <td className="py-2.5 font-semibold">{item.product_name}</td>
                    <td className="py-2.5 text-right font-bold text-orange-500">{item.favorite_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trend Chart */}
      <div className="rounded-3xl border bg-background p-6 shadow-sm">
        <h3 className="text-lg font-black mb-4">Favoritos por Dia (ultimos 30 dias)</h3>
        {stats.favoritesByDay.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No hay datos de la tendencia todavia.
          </p>
        ) : (
          <ChartContainer config={{ count: { color: "#f97316" } }} className="h-64">
            <LineChart data={stats.favoritesByDay}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val + "T00:00:00")
                  return `${d.getDate()}/${d.getMonth() + 1}`
                }}
              />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}