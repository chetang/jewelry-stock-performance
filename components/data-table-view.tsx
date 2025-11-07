"use client"
import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown, Download } from "lucide-react"
import type { L2Node } from "@/lib/data-aggregator"
import type { FilterState } from "./filter-drawer"

type TableRow = {
  type: string
  caratRange: string
  code: string
  quality: string
  inventoryCount: number
  inventoryValue: number
  inHouseCount: number
  onMemoCount: number
  avgDaysOnMemo: number
  jobsCount: number
  salesCount: number
  salesValue: number
  turn: number
  needs: number
  invAging: number
  salesAging: number
}

type SortColumn = keyof TableRow
type SortDirection = "asc" | "desc"

export function DataTableView({
  types,
  caratRanges,
  L2,
  filters,
  onRowClick,
}: {
  types: string[]
  caratRanges: string[]
  L2: Record<string, L2Node>
  filters: FilterState
  onRowClick: (type: string, caratRange: string, code: string, quality: string) => void
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("type")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const allRows = useMemo(() => {
    const rows: TableRow[] = []

    types.forEach((type) => {
      caratRanges.forEach((caratRange) => {
        const key = `${type}||${caratRange}`
        const l2Node = L2[key]

        if (!l2Node) return

        l2Node.codes.forEach((code) => {
          l2Node.qualities.forEach((quality) => {
            const cell = l2Node.grid?.[code]?.[quality]
            if (!cell) return

            rows.push({
              type,
              caratRange,
              code,
              quality,
              inventoryCount: cell.inventory_count || 0,
              inventoryValue: cell.inventory_value || 0,
              inHouseCount: cell.in_house_count || 0,
              onMemoCount: cell.on_memo_count || 0,
              avgDaysOnMemo: cell.avg_days_on_memo || 0,
              jobsCount: cell.jobs_count || 0,
              salesCount: cell.sales_count || 0,
              salesValue: cell.sales_value || 0,
              turn: cell.turn || 0,
              needs: cell.needs || 0,
              invAging: cell.inv_aging || 0,
              salesAging: cell.sales_aging || 0,
            })
          })
        })
      })
    })

    return rows
  }, [types, caratRanges, L2])

  function sortCaratRanges(ranges: string[]): string[] {
    return [...ranges].sort((a, b) => {
      const aStart = Number.parseFloat(a.split("-")[0])
      const bStart = Number.parseFloat(b.split("-")[0])
      return aStart - bStart
    })
  }

  const uniqueValues = useMemo(() => {
    const codes = new Set<string>()
    const qualities = new Set<string>()

    allRows.forEach((row) => {
      codes.add(row.code)
      qualities.add(row.quality)
    })

    return {
      types: [...types].sort(),
      caratRanges: sortCaratRanges(caratRanges),
      codes: Array.from(codes).sort(),
      qualities: Array.from(qualities).sort(),
    }
  }, [allRows, types, caratRanges])

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const numericFilters: Array<{ key: keyof TableRow; filter: { min: string; max: string } }> = [
        { key: "inventoryCount", filter: filters.inventoryCount },
        { key: "inventoryValue", filter: filters.inventoryValue },
        { key: "salesCount", filter: filters.salesCount },
        { key: "salesValue", filter: filters.salesValue },
        { key: "jobsCount", filter: filters.jobsCount },
        { key: "turn", filter: filters.turn },
        { key: "needs", filter: filters.needs },
        { key: "invAging", filter: filters.invAging },
        { key: "salesAging", filter: filters.salesAging },
      ]

      for (const { key, filter } of numericFilters) {
        const value = row[key] as number
        if (filter.min !== "" && value < Number.parseFloat(filter.min)) return false
        if (filter.max !== "" && value > Number.parseFloat(filter.max)) return false
      }

      return true
    })
  }, [allRows, filters])

  const summary = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => ({
        inventoryCount: acc.inventoryCount + row.inventoryCount,
        inventoryValue: acc.inventoryValue + row.inventoryValue,
        salesCount: acc.salesCount + row.salesCount,
        salesValue: acc.salesValue + row.salesValue,
      }),
      { inventoryCount: 0, inventoryValue: 0, salesCount: 0, salesValue: 0 },
    )
  }, [filteredRows])

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows]
    sorted.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    return sorted
  }, [filteredRows, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedRows.length / pageSize)
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedRows.slice(startIndex, startIndex + pageSize)
  }, [sortedRows, currentPage, pageSize])

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  function downloadCSV() {
    const headers = [
      "Type",
      "Carat Range",
      "Style No",
      "Quality",
      "Inv. Count",
      "Inv. Value",
      "In-House Count",
      "On-Memo Count",
      "Avg Days On Memo",
      "Jobs Count",
      "Sales Count",
      "Sales Value",
      "Turn",
      "Needs/Surplus",
      "Inv. Aging",
      "Sales Aging",
    ]

    const rows = sortedRows.map((row) => [
      row.type,
      row.caratRange,
      row.code,
      row.quality,
      row.inventoryCount,
      Math.round(row.inventoryValue),
      row.inHouseCount,
      row.onMemoCount,
      Math.round(row.avgDaysOnMemo),
      row.jobsCount,
      row.salesCount,
      Math.round(row.salesValue),
      row.turn.toFixed(2),
      row.needs,
      Math.round(row.invAging),
      Math.round(row.salesAging),
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `jewelry-data-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 text-right text-xs text-muted-foreground">
          Showing {sortedRows.length} of {allRows.length} rows
        </div>
        <button
          type="button"
          onClick={downloadCSV}
          className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="max-h-[650px] overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted">
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-left font-medium hover:bg-muted/80"
                  onClick={() => handleSort("type")}
                >
                  Type
                  <SortIcon column="type" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-left font-medium hover:bg-muted/80"
                  onClick={() => handleSort("caratRange")}
                >
                  Carat Range
                  <SortIcon column="caratRange" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-left font-medium hover:bg-muted/80"
                  onClick={() => handleSort("code")}
                >
                  Style No
                  <SortIcon column="code" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-left font-medium hover:bg-muted/80"
                  onClick={() => handleSort("quality")}
                >
                  Quality
                  <SortIcon column="quality" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("inventoryCount")}
                >
                  Inv. Count
                  <SortIcon column="inventoryCount" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("inventoryValue")}
                >
                  Inv. Value
                  <SortIcon column="inventoryValue" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("inHouseCount")}
                >
                  In-House
                  <SortIcon column="inHouseCount" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("onMemoCount")}
                >
                  On-Memo
                  <SortIcon column="onMemoCount" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("avgDaysOnMemo")}
                >
                  Avg Days On Memo
                  <SortIcon column="avgDaysOnMemo" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("jobsCount")}
                >
                  Jobs Count
                  <SortIcon column="jobsCount" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("salesCount")}
                >
                  Sales Count
                  <SortIcon column="salesCount" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("salesValue")}
                >
                  Sales Value
                  <SortIcon column="salesValue" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("turn")}
                >
                  Turn
                  <SortIcon column="turn" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("needs")}
                >
                  Needs/Surplus
                  <SortIcon column="needs" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("invAging")}
                >
                  Inv. Aging
                  <SortIcon column="invAging" />
                </th>
                <th
                  className="sticky top-0 z-10 cursor-pointer border bg-muted px-3 py-2 text-right font-medium hover:bg-muted/80"
                  onClick={() => handleSort("salesAging")}
                >
                  Sales Aging
                  <SortIcon column="salesAging" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => (
                <tr
                  key={i}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(row.type, row.caratRange, row.code, row.quality)}
                >
                  <td className="border px-3 py-2">{row.type}</td>
                  <td className="border px-3 py-2">{row.caratRange}</td>
                  <td className="border px-3 py-2">{row.code}</td>
                  <td className="border px-3 py-2">{row.quality}</td>
                  <td className="border px-3 py-2 text-right">{row.inventoryCount.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">${Math.round(row.inventoryValue).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{row.inHouseCount.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{row.onMemoCount.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{Math.round(row.avgDaysOnMemo)}</td>
                  <td className="border px-3 py-2 text-right">{row.jobsCount.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{row.salesCount.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">${Math.round(row.salesValue).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{row.turn.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{row.needs.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{Math.round(row.invAging)}</td>
                  <td className="border px-3 py-2 text-right">{Math.round(row.salesAging)}</td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td className="border px-3 py-4 text-center text-muted-foreground" colSpan={16}>
                    No data matches your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
