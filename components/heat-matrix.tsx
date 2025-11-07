"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { getColorForValue } from "@/lib/color-utils"
import { useState } from "react"

type MetricKey =
  | "inventory_count"
  | "inventory_value"
  | "sales_count"
  | "sales_value"
  | "turn"
  | "needs"
  | "jobs_count"
  | "in_house_count"
  | "on_memo_count"
  | "avg_days_on_memo"

type Cell = {
  inventory_count?: number
  inventory_value?: number
  sales_count?: number
  sales_value?: number
  turn?: number
  needs?: number
  jobs_count?: number
  avg_aging?: number
  in_house_count?: number
  on_memo_count?: number
  avg_days_on_memo?: number
}

function CellTooltip({
  rowKey,
  colKey,
  cell,
  position,
}: {
  rowKey: string
  colKey: string
  cell: Cell | undefined
  position: { x: number; y: number }
}) {
  if (!cell) return null

  const formatCurrency = (val: number) => `$${(val / 1000).toFixed(0)}K`
  const formatNumber = (val: number) => val.toLocaleString()

  const hasNoData =
    (!cell.inventory_count || cell.inventory_count === 0) && (!cell.sales_count || cell.sales_count === 0)

  const needsSurplusLabel = (cell.needs || 0) >= 0 ? "Needs:" : "Surplus:"

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -120%)",
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 p-2 min-w-[180px]">
        {/* Title - center aligned and bold */}
        <div className="text-center font-bold mb-1.5 pb-1.5 border-b border-gray-700 text-xs">
          {rowKey} • {colKey}
        </div>

        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">Inventory:</span>
            <span className="font-medium">
              {hasNoData
                ? "-"
                : `${formatCurrency(cell.inventory_value || 0)} / ${formatNumber(cell.inventory_count || 0)}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Sales:</span>
            <span className="font-medium">
              {hasNoData ? "-" : `${formatCurrency(cell.sales_value || 0)} / ${formatNumber(cell.sales_count || 0)}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Avg Aging / Turn:</span>
            <span className="font-medium">
              {hasNoData
                ? "-"
                : `${cell.avg_aging ? `${Math.round(cell.avg_aging)} days` : "-"} / ${(cell.turn || 0).toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Jobs:</span>
            <span className="font-medium">{hasNoData ? "-" : formatNumber(cell.jobs_count || 0)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">{needsSurplusLabel}</span>
            <span className="font-medium">{hasNoData ? "-" : formatNumber(cell.needs || 0)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">In-House / On-Memo:</span>
            <span className="font-medium">
              {hasNoData ? "-" : `${formatNumber(cell.in_house_count || 0)} / ${formatNumber(cell.on_memo_count || 0)}`}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-300">Avg Days On Memo:</span>
            <span className="font-medium">
              {hasNoData || !cell.avg_days_on_memo ? "-" : `${Math.round(cell.avg_days_on_memo)} days`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeatMatrix({
  rowHeader,
  rows,
  cols,
  getCell,
  metric,
  allValues,
  idealTurn,
  onCellClick,
  titleForCell,
}: {
  rowHeader: string
  rows: string[]
  cols: string[]
  getCell: (rowKey: string, colKey: string) => Cell | undefined
  metric: MetricKey
  allValues: number[]
  idealTurn?: number
  onCellClick?: (rowKey: string, colKey: string) => void
  titleForCell?: (rowKey: string, colKey: string, cell: Cell | undefined) => string
}) {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; x: number; y: number } | null>(null)

  function display(metric: MetricKey, val: number) {
    if (metric.includes("value")) {
      return Math.round(val || 0).toLocaleString()
    }
    if (metric === "turn") {
      return (val || 0).toFixed(2)
    }
    return (val || 0).toLocaleString()
  }

  const handleMouseEnter = (e: React.MouseEvent, r: string, c: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoveredCell({
      row: r,
      col: c,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  return (
    <div className="mx-auto max-w-[1080px] w-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <colgroup>
          <col className="w-[120px]" />
          {cols.map((_, i) => (
            <col key={i} className="w-[90px]" />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 border bg-muted px-2 py-1 text-left font-medium">{rowHeader}</th>
            {cols.map((c) => (
              <th key={c} className="sticky top-0 z-10 border bg-muted px-2 py-1 font-medium text-center">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th className="sticky left-0 z-10 border bg-muted px-2 py-1 text-left font-medium">{r}</th>
              {cols.map((c) => {
                const cell = getCell(r, c)
                const hasNoData =
                  (!cell?.inventory_count || cell.inventory_count === 0) &&
                  (!cell?.sales_count || cell.sales_count === 0)

                const v = Number(cell?.[metric] ?? 0)

                const { bg, text } = hasNoData
                  ? { bg: "#ffffff", text: "#000000" }
                  : getColorForValue(v, allValues, metric, idealTurn)

                const label = hasNoData ? "-" : display(metric, v)

                return (
                  <td key={c} className="border p-0">
                    <button
                      type="button"
                      className={cn(
                        "flex h-8 w-full items-center justify-center px-1 font-medium text-center",
                        "hover:opacity-80 transition-opacity",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                      style={{ backgroundColor: bg, color: text }}
                      onClick={onCellClick ? () => onCellClick(r, c) : undefined}
                      onMouseEnter={(e) => handleMouseEnter(e, r, c)}
                      onMouseLeave={handleMouseLeave}
                      aria-label={`${r} ${c} ${label}`}
                    >
                      <span>{label}</span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {hoveredCell && (
        <CellTooltip
          rowKey={hoveredCell.row}
          colKey={hoveredCell.col}
          cell={getCell(hoveredCell.row, hoveredCell.col)}
          position={{ x: hoveredCell.x, y: hoveredCell.y }}
        />
      )}
    </div>
  )
}
