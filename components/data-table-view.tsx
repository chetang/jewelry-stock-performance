"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  ShoppingCart,
} from "lucide-react"
import type { L2Node } from "@/lib/data-aggregator"

type TableRow = {
  type: string
  caratRange: string
  code: string
  quality: string
  inventoryCount: number
  inventoryValue: number
  salesCount: number
  salesValue: number
  turn: number
  needs: number
  overhang: number
  invAging: number
  salesAging: number
}

type SortColumn = keyof TableRow
type SortDirection = "asc" | "desc"

type ColumnFilters = {
  type: string[]
  caratRange: string[]
  code: string[]
  quality: string[]
  inventoryCount: { min: string; max: string }
  inventoryValue: { min: string; max: string }
  salesCount: { min: string; max: string }
  salesValue: { min: string; max: string }
  turn: { min: string; max: string }
  needs: { min: string; max: string }
  overhang: { min: string; max: string }
  invAging: { min: string; max: string }
  salesAging: { min: string; max: string }
}

export function DataTableView({
  types,
  caratRanges,
  L2,
  onRowClick,
}: {
  types: string[]
  caratRanges: string[]
  L2: Record<string, L2Node>
  onRowClick: (type: string, caratRange: string, code: string, quality: string) => void
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("type")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    type: [],
    caratRange: [],
    code: [],
    quality: [],
    inventoryCount: { min: "", max: "" },
    inventoryValue: { min: "", max: "" },
    salesCount: { min: "", max: "" },
    salesValue: { min: "", max: "" },
    turn: { min: "", max: "" },
    needs: { min: "", max: "" },
    overhang: { min: "", max: "" },
    invAging: { min: "", max: "" },
    salesAging: { min: "", max: "" },
  })

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
              salesCount: cell.sales_count || 0,
              salesValue: cell.sales_value || 0,
              turn: cell.turn || 0,
              needs: cell.needs || 0,
              overhang: cell.overhang || 0,
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
      if (columnFilters.type.length > 0 && !columnFilters.type.includes(row.type)) return false
      if (columnFilters.caratRange.length > 0 && !columnFilters.caratRange.includes(row.caratRange)) return false
      if (columnFilters.code.length > 0 && !columnFilters.code.includes(row.code)) return false
      if (columnFilters.quality.length > 0 && !columnFilters.quality.includes(row.quality)) return false

      const numericFilters: Array<{ key: keyof TableRow; filter: { min: string; max: string } }> = [
        { key: "inventoryCount", filter: columnFilters.inventoryCount },
        { key: "inventoryValue", filter: columnFilters.inventoryValue },
        { key: "salesCount", filter: columnFilters.salesCount },
        { key: "salesValue", filter: columnFilters.salesValue },
        { key: "turn", filter: columnFilters.turn },
        { key: "needs", filter: columnFilters.needs },
        { key: "overhang", filter: columnFilters.overhang },
        { key: "invAging", filter: columnFilters.invAging },
        { key: "salesAging", filter: columnFilters.salesAging },
      ]

      for (const { key, filter } of numericFilters) {
        const value = row[key] as number
        if (filter.min !== "" && value < Number.parseFloat(filter.min)) return false
        if (filter.max !== "" && value > Number.parseFloat(filter.max)) return false
      }

      return true
    })
  }, [allRows, columnFilters])

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

  useMemo(() => {
    setCurrentPage(1)
  }, [columnFilters, sortColumn, sortDirection])

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

  function toggleDropdownFilter(key: "type" | "caratRange" | "code" | "quality", value: string) {
    setColumnFilters((prev) => {
      const current = prev[key]
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      return { ...prev, [key]: updated }
    })
  }

  function updateMinMaxFilter(
    key: keyof Omit<ColumnFilters, "type" | "caratRange" | "code" | "quality">,
    field: "min" | "max",
    value: string,
  ) {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  function clearAllFilters() {
    setColumnFilters({
      type: [],
      caratRange: [],
      code: [],
      quality: [],
      inventoryCount: { min: "", max: "" },
      inventoryValue: { min: "", max: "" },
      salesCount: { min: "", max: "" },
      salesValue: { min: "", max: "" },
      turn: { min: "", max: "" },
      needs: { min: "", max: "" },
      overhang: { min: "", max: "" },
      invAging: { min: "", max: "" },
      salesAging: { min: "", max: "" },
    })
  }

  const hasActiveFilters = useMemo(() => {
    return (
      columnFilters.type.length > 0 ||
      columnFilters.caratRange.length > 0 ||
      columnFilters.code.length > 0 ||
      columnFilters.quality.length > 0 ||
      columnFilters.inventoryCount.min !== "" ||
      columnFilters.inventoryCount.max !== "" ||
      columnFilters.inventoryValue.min !== "" ||
      columnFilters.inventoryValue.max !== "" ||
      columnFilters.salesCount.min !== "" ||
      columnFilters.salesCount.max !== "" ||
      columnFilters.salesValue.min !== "" ||
      columnFilters.salesValue.max !== "" ||
      columnFilters.turn.min !== "" ||
      columnFilters.turn.max !== "" ||
      columnFilters.needs.min !== "" ||
      columnFilters.needs.max !== "" ||
      columnFilters.overhang.min !== "" ||
      columnFilters.overhang.max !== "" ||
      columnFilters.invAging.min !== "" ||
      columnFilters.invAging.max !== "" ||
      columnFilters.salesAging.min !== "" ||
      columnFilters.salesAging.max !== ""
    )
  }, [columnFilters])

  function downloadCSV() {
    const headers = [
      "Type",
      "Carat Range",
      "Sub Type",
      "Quality",
      "Inv. Count",
      "Inv. Value",
      "Sales Count",
      "Sales Value",
      "Turn",
      "Needs/Surplus",
      "Overhang",
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
      row.salesCount,
      Math.round(row.salesValue),
      row.turn.toFixed(2),
      row.needs,
      Math.round(row.overhang),
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

  function MultiSelectDropdown({
    label,
    options,
    selected,
    onToggle,
  }: {
    label: string
    options: string[]
    selected: string[]
    onToggle: (value: string) => void
  }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div className="relative">
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded border bg-background px-3 text-sm hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">{selected.length === 0 ? `All ${label}` : `${selected.length} selected`}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.preventDefault()
                setIsOpen(false)
              }}
            />
            <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[200px] overflow-auto rounded border bg-popover shadow-lg">
              {options.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={(e) => {
                      e.stopPropagation()
                      onToggle(option)
                    }}
                    className="h-4 w-4"
                  />
                  <span className="truncate">{option}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  function MinMaxInput({
    label,
    min,
    max,
    onMinChange,
    onMaxChange,
  }: {
    label: string
    min: string
    max: string
    onMinChange: (value: string) => void
    onMaxChange: (value: string) => void
  }) {
    return (
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          className="h-9 w-full min-w-[80px] rounded border bg-background px-3 text-sm"
        />
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          className="h-9 w-full min-w-[80px] rounded border bg-background px-3 text-sm"
        />
      </div>
    )
  }

  const activeFilterBadges = useMemo(() => {
    const badges: Array<{ label: string; onRemove: () => void }> = []

    columnFilters.type.forEach((value) => {
      badges.push({
        label: `Type: ${value}`,
        onRemove: () => toggleDropdownFilter("type", value),
      })
    })

    columnFilters.caratRange.forEach((value) => {
      badges.push({
        label: `Carat: ${value}`,
        onRemove: () => toggleDropdownFilter("caratRange", value),
      })
    })

    columnFilters.code.forEach((value) => {
      badges.push({
        label: `Sub Type: ${value}`,
        onRemove: () => toggleDropdownFilter("code", value),
      })
    })

    columnFilters.quality.forEach((value) => {
      badges.push({
        label: `Quality: ${value}`,
        onRemove: () => toggleDropdownFilter("quality", value),
      })
    })

    const numericFilters: Array<{
      key: keyof Omit<ColumnFilters, "type" | "caratRange" | "code" | "quality">
      label: string
    }> = [
      { key: "inventoryCount", label: "Inv. Count" },
      { key: "inventoryValue", label: "Inv. Value" },
      { key: "salesCount", label: "Sales Count" },
      { key: "salesValue", label: "Sales Value" },
      { key: "turn", label: "Turn" },
      { key: "needs", label: "Needs/Surplus" },
      { key: "overhang", label: "Overhang" },
      { key: "invAging", label: "Inv. Aging" },
      { key: "salesAging", label: "Sales Aging" },
    ]

    numericFilters.forEach(({ key, label }) => {
      const filter = columnFilters[key]
      if (filter.min !== "" || filter.max !== "") {
        const rangeText =
          filter.min !== "" && filter.max !== ""
            ? `${filter.min}-${filter.max}`
            : filter.min !== ""
              ? `≥${filter.min}`
              : `≤${filter.max}`
        badges.push({
          label: `${label}: ${rangeText}`,
          onRemove: () => updateMinMaxFilter(key, "min", ""),
        })
      }
    })

    return badges
  }, [columnFilters])

  function PaginationControls() {
    const maxVisiblePages = 5
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

    return (
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="rounded border bg-background px-2 py-1"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
          <span className="ml-4 text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedRows.length)} of{" "}
            {sortedRows.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="rounded border bg-background px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded border bg-background p-1 hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`rounded border px-3 py-1 text-xs ${
                currentPage === page ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded border bg-background p-1 hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded border bg-background px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Package className="h-4 w-4 text-blue-500" />
            <span>Inv. Count</span>
          </div>
          <div className="text-lg font-semibold">{summary.inventoryCount.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span>Inv. Value</span>
          </div>
          <div className="text-lg font-semibold">${Math.round(summary.inventoryValue).toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <ShoppingCart className="h-4 w-4 text-green-500" />
            <span>Sales Count</span>
          </div>
          <div className="text-lg font-semibold">{summary.salesCount.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>Sales Value</span>
          </div>
          <div className="text-lg font-semibold">${Math.round(summary.salesValue).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
          {hasActiveFilters && <span className="ml-2 text-xs text-primary">(Active)</span>}
        </button>
        {hasActiveFilters && (
          <>
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
            >
              <X className="h-3 w-3" />
              Clear Filters
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {activeFilterBadges.map((badge, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                >
                  {badge.label}
                  <button
                    type="button"
                    onClick={badge.onRemove}
                    className="hover:text-primary/80"
                    aria-label={`Remove ${badge.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}
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

      {showFilters && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="mb-2 text-sm font-medium">Type</div>
              <MultiSelectDropdown
                label="Type"
                options={uniqueValues.types}
                selected={columnFilters.type}
                onToggle={(value) => toggleDropdownFilter("type", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Carat Range</div>
              <MultiSelectDropdown
                label="Carat"
                options={uniqueValues.caratRanges}
                selected={columnFilters.caratRange}
                onToggle={(value) => toggleDropdownFilter("caratRange", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Sub Type</div>
              <MultiSelectDropdown
                label="Sub Type"
                options={uniqueValues.codes}
                selected={columnFilters.code}
                onToggle={(value) => toggleDropdownFilter("code", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Quality</div>
              <MultiSelectDropdown
                label="Quality"
                options={uniqueValues.qualities}
                selected={columnFilters.quality}
                onToggle={(value) => toggleDropdownFilter("quality", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="mb-2 text-sm font-medium">Inv. Count</div>
              <MinMaxInput
                label="Inv. Count"
                min={columnFilters.inventoryCount.min}
                max={columnFilters.inventoryCount.max}
                onMinChange={(value) => updateMinMaxFilter("inventoryCount", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("inventoryCount", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Inv. Value</div>
              <MinMaxInput
                label="Inv. Value"
                min={columnFilters.inventoryValue.min}
                max={columnFilters.inventoryValue.max}
                onMinChange={(value) => updateMinMaxFilter("inventoryValue", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("inventoryValue", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Sales Count</div>
              <MinMaxInput
                label="Sales Count"
                min={columnFilters.salesCount.min}
                max={columnFilters.salesCount.max}
                onMinChange={(value) => updateMinMaxFilter("salesCount", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("salesCount", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Sales Value</div>
              <MinMaxInput
                label="Sales Value"
                min={columnFilters.salesValue.min}
                max={columnFilters.salesValue.max}
                onMinChange={(value) => updateMinMaxFilter("salesValue", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("salesValue", "max", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="mb-2 text-sm font-medium">Turn</div>
              <MinMaxInput
                label="Turn"
                min={columnFilters.turn.min}
                max={columnFilters.turn.max}
                onMinChange={(value) => updateMinMaxFilter("turn", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("turn", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Needs/Surplus</div>
              <MinMaxInput
                label="Needs/Surplus"
                min={columnFilters.needs.min}
                max={columnFilters.needs.max}
                onMinChange={(value) => updateMinMaxFilter("needs", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("needs", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Overhang</div>
              <MinMaxInput
                label="Overhang"
                min={columnFilters.overhang.min}
                max={columnFilters.overhang.max}
                onMinChange={(value) => updateMinMaxFilter("overhang", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("overhang", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Inv. Aging</div>
              <MinMaxInput
                label="Inv. Aging"
                min={columnFilters.invAging.min}
                max={columnFilters.invAging.max}
                onMinChange={(value) => updateMinMaxFilter("invAging", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("invAging", "max", value)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-medium">Sales Aging</div>
              <MinMaxInput
                label="Sales Aging"
                min={columnFilters.salesAging.min}
                max={columnFilters.salesAging.max}
                onMinChange={(value) => updateMinMaxFilter("salesAging", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("salesAging", "max", value)}
              />
            </div>
          </div>
        </div>
      )}

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
                  Sub Type
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
                  onClick={() => handleSort("overhang")}
                >
                  Overhang
                  <SortIcon column="overhang" />
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
                  <td className="border px-3 py-2 text-right">{row.salesCount.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">${Math.round(row.salesValue).toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{row.turn.toFixed(2)}</td>
                  <td className="border px-3 py-2 text-right">{row.needs.toLocaleString()}</td>
                  <td className="border px-3 py-2 text-right">{Math.round(row.overhang)}</td>
                  <td className="border px-3 py-2 text-right">{Math.round(row.invAging)}</td>
                  <td className="border px-3 py-2 text-right">{Math.round(row.salesAging)}</td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td className="border px-3 py-4 text-center text-muted-foreground" colSpan={14}>
                    No data matches your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls />
      </div>
    </div>
  )
}
