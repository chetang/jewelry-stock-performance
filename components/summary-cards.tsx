import type React from "react"
import { Package, DollarSign, ShoppingCart, TrendingUp, BarChart3, Briefcase } from "lucide-react"

type L1Cell = {
  inventory_count?: number
  inventory_value?: number
  sales_count?: number
  sales_value?: number
  turn?: number
  needs?: number
  jobs_count?: number // Added jobs_count
}

export function SummaryCards({
  rows,
  avg,
}: {
  rows: L1Cell[]
  avg: (arr: number[]) => number
}) {
  const invCount = rows.reduce((s, r) => s + (r.inventory_count || 0), 0)
  const invValue = rows.reduce((s, r) => s + (r.inventory_value || 0), 0)
  const salesCount = rows.reduce((s, r) => s + (r.sales_count || 0), 0)
  const salesValue = rows.reduce((s, r) => s + (r.sales_value || 0), 0)
  const turnVals = rows.map((r) => r.turn || 0)
  const needs = rows.reduce((s, r) => s + (r.needs || 0), 0)
  const jobsCount = rows.reduce((s, r) => s + (r.jobs_count || 0), 0)

  const items: { t: string; v: string; icon: React.ReactNode }[] = [
    { t: "Inventory Count", v: invCount.toLocaleString(), icon: <Package className="h-4 w-4 text-blue-500" /> },
    {
      t: "Inventory Value",
      v: Math.round(invValue).toLocaleString(),
      icon: <DollarSign className="h-4 w-4 text-blue-600" />,
    },
    { t: "Sales Count", v: salesCount.toLocaleString(), icon: <ShoppingCart className="h-4 w-4 text-green-500" /> },
    {
      t: "Sales Value",
      v: Math.round(salesValue).toLocaleString(),
      icon: <DollarSign className="h-4 w-4 text-green-600" />,
    },
    {
      t: "Turn",
      v: invCount ? (salesCount / Math.max(invCount, 1)).toFixed(2) : avg(turnVals).toFixed(2),
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
    },
    { t: "Needs/Surplus", v: needs.toLocaleString(), icon: <BarChart3 className="h-4 w-4 text-purple-500" /> },
    { t: "Jobs Count", v: jobsCount.toLocaleString(), icon: <Briefcase className="h-4 w-4 text-amber-500" /> },
  ]

  return (
    <div className="grid grid-cols-7 gap-3">
      {items.map((it) => (
        <div key={it.t} className="rounded-lg border bg-card px-3 py-3 shadow-sm" role="group" aria-label={it.t}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            {it.icon}
            <span>{it.t}</span>
          </div>
          <div className="text-lg font-semibold">{it.v}</div>
        </div>
      ))}
    </div>
  )
}
