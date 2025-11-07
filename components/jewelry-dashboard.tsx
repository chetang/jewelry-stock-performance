"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { SummaryCards } from "./summary-cards"
import { HeatMatrix } from "./heat-matrix"
import { DetailsTables } from "./details-tables"
import { DataTableView } from "./data-table-view"
import { FilterDrawer, defaultFilters, type FilterState } from "./filter-drawer"
import { FilterBadges } from "./filter-badges"
import { dataService } from "@/lib/data-service"
import { useAuth } from "@/lib/auth-context"
import type { MetricKey, L1Cell } from "@/lib/data-aggregator"
import { LayoutGrid, Table, Check, X, LogOut, Filter, Save } from "lucide-react"
import { SaveFilterDialog } from "./save-filter-dialog"
import { SavedFiltersDropdown } from "./saved-filters-dropdown"
import { savedFiltersService, type SavedFilter } from "@/lib/saved-filters"

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "inventory_count", label: "Inventory Count" },
  { key: "inventory_value", label: "Inventory Value" },
  { key: "sales_count", label: "Sales Count" },
  { key: "sales_value", label: "Sales Value" },
  { key: "turn", label: "Turn" },
  { key: "needs", label: "Needs/Surplus" },
]

function avg(arr: number[]) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}
function metricValue(obj: L1Cell | undefined, metric: MetricKey) {
  return obj?.[metric] ?? 0
}

type View = "l1" | "l2" | "details"
type DisplayMode = "grid" | "table"

export function JewelryDashboard() {
  const { logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [l1Data, setL1Data] = useState<any>(null)
  const [l2Data, setL2Data] = useState<any>(null)
  const [l3Data, setL3Data] = useState<any>(null)
  const [tableData, setTableData] = useState<any>(null)

  const [metric, setMetric] = useState<MetricKey>("inventory_count")
  const [dateFrom, setDateFrom] = useState<string>("2023-01-01")
  const [dateTo, setDateTo] = useState<string>("2023-10-10")

  const [idealTurn, setIdealTurn] = useState<number>(1.4)
  const [pendingIdealTurn, setPendingIdealTurn] = useState<string>("1.4")
  const [hasIdealTurnChanges, setHasIdealTurnChanges] = useState(false)

  const [view, setView] = useState<View>("l1")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("grid")
  const [l2Type, setL2Type] = useState<string>("")
  const [l2CR, setL2CR] = useState<string>("")

  const [detailsCode, setDetailsCode] = useState<string>("")
  const [detailsQuality, setDetailsQuality] = useState<string>("")

  const [types, setTypes] = useState<string[]>([])
  const [caratRanges, setCaratRanges] = useState<string[]>([])

  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters })
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [isSaveFilterDialogOpen, setIsSaveFilterDialogOpen] = useState(false)

  useEffect(() => {
    setSavedFilters(savedFiltersService.getAll())
  }, [])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        const itemFilters = {
          type: filters.type,
          carat_range: filters.caratRange,
          style_no: filters.code,
          quality: filters.quality,
          memo_status: filters.memoStatus,
          days_on_memo: filters.daysOnMemo,
        }

        const l1Response = await dataService.getLevel1Grid({
          metric,
          date_from: dateFrom,
          date_to: dateTo,
          ideal_turn: idealTurn,
          item_filters: itemFilters,
        })

        setL1Data(l1Response)

        const typesSet = new Set<string>()
        const caratRangesSet = new Set<string>()

        Object.keys(l1Response.data || {}).forEach((caratRange) => {
          caratRangesSet.add(caratRange)
          Object.keys(l1Response.data[caratRange] || {}).forEach((type) => {
            typesSet.add(type)
          })
        })

        setTypes(Array.from(typesSet))
        setCaratRanges(Array.from(caratRangesSet))

        setLoading(false)
      } catch (err) {
        console.error("[v0] Error loading data:", err)
        setError("Failed to load jewelry data. Please try again.")
        setLoading(false)
      }
    }

    loadData()
  }, [
    metric,
    dateFrom,
    dateTo,
    idealTurn,
    filters.type,
    filters.caratRange,
    filters.code,
    filters.quality,
    filters.memoStatus,
    filters.daysOnMemo,
  ])

  useEffect(() => {
    if (view === "l2" && l2Type && l2CR) {
      async function loadL2Data() {
        try {
          const itemFilters = {
            type: filters.type,
            carat_range: filters.caratRange,
            style_no: filters.code,
            quality: filters.quality,
            memo_status: filters.memoStatus,
            days_on_memo: filters.daysOnMemo,
          }

          const l2Response = await dataService.getLevel2Grid({
            metric,
            date_from: dateFrom,
            date_to: dateTo,
            ideal_turn: idealTurn,
            category: l2Type,
            carat_range: l2CR,
            item_filters: itemFilters,
          })
          setL2Data(l2Response)
        } catch (err) {
          console.error("[v0] Error loading L2 data:", err)
        }
      }
      loadL2Data()
    }
  }, [
    view,
    l2Type,
    l2CR,
    metric,
    dateFrom,
    dateTo,
    idealTurn,
    filters.type,
    filters.caratRange,
    filters.code,
    filters.quality,
    filters.memoStatus,
    filters.daysOnMemo,
  ])

  useEffect(() => {
    if (view === "details" && l2Type && l2CR && detailsCode && detailsQuality) {
      async function loadL3Data() {
        try {
          const l3Response = await dataService.getLevel3Detail({
            date_from: dateFrom,
            date_to: dateTo,
            ideal_turn: idealTurn,
            category: l2Type,
            carat_range: l2CR,
            sub_category: detailsCode,
            quality: detailsQuality,
          })
          setL3Data(l3Response)
        } catch (err) {
          console.error("[v0] Error loading L3 data:", err)
        }
      }
      loadL3Data()
    }
  }, [view, l2Type, l2CR, detailsCode, detailsQuality, dateFrom, dateTo, idealTurn])

  useEffect(() => {
    async function loadTableData() {
      try {
        const itemFilters = {
          type: filters.type,
          carat_range: filters.caratRange,
          style_no: filters.code,
          quality: filters.quality,
          memo_status: filters.memoStatus,
          days_on_memo: filters.daysOnMemo,
        }

        const tableResponse = await dataService.getTableView({
          metric,
          date_from: dateFrom,
          date_to: dateTo,
          ideal_turn: idealTurn,
          item_filters: itemFilters,
        })
        setTableData(tableResponse)
      } catch (err) {
        console.error("[v0] Error loading table data:", err)
      }
    }
    loadTableData()
  }, [
    metric,
    dateFrom,
    dateTo,
    idealTurn,
    filters.type,
    filters.caratRange,
    filters.code,
    filters.quality,
    filters.memoStatus,
    filters.daysOnMemo,
  ])

  const handleIdealTurnChange = (value: string) => {
    setPendingIdealTurn(value)
    const numValue = Number(value)
    setHasIdealTurnChanges(!isNaN(numValue) && numValue !== idealTurn && numValue > 0)
  }

  const applyIdealTurn = () => {
    const numValue = Number(pendingIdealTurn)
    if (!isNaN(numValue) && numValue > 0) {
      setIdealTurn(numValue)
      setHasIdealTurnChanges(false)
    }
  }

  const cancelIdealTurn = () => {
    setPendingIdealTurn(idealTurn.toString())
    setHasIdealTurnChanges(false)
  }

  const availableFilterOptions = useMemo(() => {
    const codes = new Set<string>()
    const qualities = new Set<string>()

    Object.values(tableData?.data || {}).forEach((node: any) => {
      node.codes?.forEach((code: string) => codes.add(code))
      node.qualities?.forEach((quality: string) => qualities.add(quality))
    })

    return {
      types: types,
      caratRanges: caratRanges,
      codes: Array.from(codes).sort(),
      qualities: Array.from(qualities).sort(),
    }
  }, [types, caratRanges, tableData])

  function applyFiltersToL1Cell(type: string, caratRange: string, cell: L1Cell | undefined): boolean {
    if (!cell) return false

    if (
      filters.inventoryCount.min !== "" &&
      (cell.inventory_count || 0) < Number.parseFloat(filters.inventoryCount.min)
    )
      return false
    if (
      filters.inventoryCount.max !== "" &&
      (cell.inventory_count || 0) > Number.parseFloat(filters.inventoryCount.max)
    )
      return false

    if (
      filters.inventoryValue.min !== "" &&
      (cell.inventory_value || 0) < Number.parseFloat(filters.inventoryValue.min)
    )
      return false
    if (
      filters.inventoryValue.max !== "" &&
      (cell.inventory_value || 0) > Number.parseFloat(filters.inventoryValue.max)
    )
      return false

    if (filters.salesCount.min !== "" && (cell.sales_count || 0) < Number.parseFloat(filters.salesCount.min))
      return false
    if (filters.salesCount.max !== "" && (cell.sales_count || 0) > Number.parseFloat(filters.salesCount.max))
      return false

    if (filters.salesValue.min !== "" && (cell.sales_value || 0) < Number.parseFloat(filters.salesValue.min))
      return false
    if (filters.salesValue.max !== "" && (cell.sales_value || 0) > Number.parseFloat(filters.salesValue.max))
      return false

    if (filters.jobsCount.min !== "" && (cell.jobs_count || 0) < Number.parseFloat(filters.jobsCount.min)) return false
    if (filters.jobsCount.max !== "" && (cell.jobs_count || 0) > Number.parseFloat(filters.jobsCount.max)) return false

    if (filters.turn.min !== "" && (cell.turn || 0) < Number.parseFloat(filters.turn.min)) return false
    if (filters.turn.max !== "" && (cell.turn || 0) > Number.parseFloat(filters.turn.max)) return false

    if (filters.needs.min !== "" && (cell.needs || 0) < Number.parseFloat(filters.needs.min)) return false
    if (filters.needs.max !== "" && (cell.needs || 0) > Number.parseFloat(filters.needs.max)) return false

    if (filters.invAging.min !== "" && (cell.inv_aging || 0) < Number.parseFloat(filters.invAging.min)) return false
    if (filters.invAging.max !== "" && (cell.inv_aging || 0) > Number.parseFloat(filters.invAging.max)) return false

    if (filters.salesAging.min !== "" && (cell.sales_aging || 0) < Number.parseFloat(filters.salesAging.min))
      return false
    if (filters.salesAging.max !== "" && (cell.sales_aging || 0) > Number.parseFloat(filters.salesAging.max))
      return false

    return true
  }

  const filteredL1Data = useMemo(() => {
    if (!l1Data?.data) return null

    const filtered: Record<string, Record<string, L1Cell>> = {}

    caratRanges.forEach((cr) => {
      types.forEach((type) => {
        const cell = l1Data.data[cr]?.[type]
        if (applyFiltersToL1Cell(type, cr, cell)) {
          if (!filtered[cr]) filtered[cr] = {}
          filtered[cr][type] = cell
        }
      })
    })

    return { ...l1Data, data: filtered }
  }, [l1Data, filters, types, caratRanges])

  function handleRemoveFilter(key: string, value?: string) {
    if (key === "type" || key === "caratRange" || key === "code" || key === "quality") {
      if (value) {
        setFilters((prev) => ({
          ...prev,
          [key]: prev[key].filter((v) => v !== value),
        }))
      }
    } else {
      setFilters((prev) => ({
        ...prev,
        [key]: { min: "", max: "" },
      }))
    }
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.type.length > 0 ||
      filters.caratRange.length > 0 ||
      filters.code.length > 0 ||
      filters.quality.length > 0 ||
      filters.inventoryCount.min !== "" ||
      filters.inventoryCount.max !== "" ||
      filters.inventoryValue.min !== "" ||
      filters.inventoryValue.max !== "" ||
      filters.salesCount.min !== "" ||
      filters.salesCount.max !== "" ||
      filters.salesValue.min !== "" ||
      filters.salesValue.max !== "" ||
      filters.jobsCount.min !== "" ||
      filters.jobsCount.max !== "" ||
      filters.turn.min !== "" ||
      filters.turn.max !== "" ||
      filters.needs.min !== "" ||
      filters.needs.max !== "" ||
      filters.invAging.min !== "" ||
      filters.invAging.max !== "" ||
      filters.salesAging.min !== "" ||
      filters.salesAging.max !== "" ||
      filters.memoStatus.length > 0 ||
      filters.daysOnMemo.min !== "" ||
      filters.daysOnMemo.max !== ""
    )
  }, [filters])

  const l1AllValues = useMemo(() => {
    const vals: number[] = []
    for (const cr of caratRanges) {
      for (const t of types) {
        const value = Number(metricValue(filteredL1Data?.data?.[cr]?.[t], metric)) || 0
        vals.push(value)
      }
    }
    return vals
  }, [metric, caratRanges, types, filteredL1Data])

  const l2Key = `${l2Type}||${l2CR}`
  const l2Node = l2Data?.data?.[l2Key]

  const l2AllValues = useMemo(() => {
    const vals: number[] = []
    if (!l2Node) return vals
    for (const cd of l2Node.codes) {
      for (const q of l2Node.qualities) {
        const value = Number(metricValue(l2Node.grid?.[cd]?.[q], metric)) || 0
        vals.push(value)
      }
    }
    return vals
  }, [l2Node, metric])

  const l1FlatRows: L1Cell[] = useMemo(() => {
    const arr: L1Cell[] = []
    for (const cr of caratRanges) {
      for (const t of types) {
        const cell = filteredL1Data?.data?.[cr]?.[t]
        if (cell) arr.push(cell)
      }
    }
    return arr
  }, [caratRanges, types, filteredL1Data])

  const l2FlatRows: L1Cell[] = useMemo(() => {
    const arr: L1Cell[] = []
    if (!l2Node) return arr
    for (const cd of l2Node.codes) {
      for (const q of l2Node.qualities) {
        arr.push(l2Node.grid?.[cd]?.[q] || {})
      }
    }
    return arr
  }, [l2Node])

  function openL2(t: string, cr: string) {
    setL2Type(t)
    setL2CR(cr)
    setView("l2")
  }

  function openDetails(t: string, cr: string, code: string, quality: string) {
    setL2Type(t)
    setL2CR(cr)
    setDetailsCode(code)
    setDetailsQuality(quality)
    setView("details")
  }

  const detailsInventoryRows = useMemo(() => {
    return l3Data?.data?.inventoryRows || []
  }, [l3Data])

  const detailsSalesRows = useMemo(() => {
    return l3Data?.data?.salesRows || []
  }, [l3Data])

  function formatTooltip(r: string, c: string, obj: L1Cell | undefined) {
    const data = [
      { label: "Inventory Count", value: (obj?.inventory_count || 0).toLocaleString() },
      { label: "Inventory Value", value: `$${Math.round(obj?.inventory_value || 0).toLocaleString()}` },
      { label: "Sales Count", value: (obj?.sales_count || 0).toLocaleString() },
      { label: "Sales Value", value: `$${Math.round(obj?.sales_value || 0).toLocaleString()}` },
      { label: "Turn", value: (obj?.turn || 0).toFixed(2) },
      { label: "Needs/Surplus", value: (obj?.needs || 0).toLocaleString() },
    ]

    return [
      `╔═══ ${r} • ${c} ═══╗`,
      "",
      ...data.map((row) => `  ${row.label.padEnd(18, " ")} ${row.value.padStart(12, " ")}`),
      "",
      "╚" + "═".repeat(34) + "╝",
    ].join("\n")
  }

  function handleSaveFilter(name: string, emailEnabled: boolean, emailRecipients: string[]) {
    const savedFilter = savedFiltersService.save({
      name,
      filters,
      emailEnabled,
      emailRecipients,
    })
    setSavedFilters(savedFiltersService.getAll())

    if (emailEnabled) {
      console.log("[v0] Email report would be sent to:", emailRecipients)
    }
  }

  function handleLoadFilter(filter: SavedFilter) {
    setFilters(filter.filters)
    savedFiltersService.updateLastUsed(filter.id)
    setSavedFilters(savedFiltersService.getAll())
  }

  function handleDeleteFilter(id: string) {
    savedFiltersService.delete(id)
    setSavedFilters(savedFiltersService.getAll())
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading jewelry data...</div>
          <div className="text-sm text-muted-foreground">Fetching and processing data</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-destructive">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-center text-lg font-semibold text-balance flex-1">Finished Jewelry — Stock Performance</h1>
        {!dataService.isMockMode() && (
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>

      <section className="rounded-lg border bg-card p-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          <label className="flex flex-col text-sm text-muted-foreground">
            <span className="mb-1">Metric</span>
            <select
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
              aria-label="Metric"
            >
              {METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm text-muted-foreground">
            <span className="mb-1">Ideal Turn</span>
            <div className="relative flex items-center gap-1">
              <input
                className="rounded-md border bg-background px-2 py-1.5 text-sm w-full pr-20"
                type="number"
                step="0.1"
                min="0"
                value={pendingIdealTurn}
                onChange={(e) => handleIdealTurnChange(e.target.value)}
                aria-label="Ideal Turn"
              />
              {hasIdealTurnChanges && (
                <div className="absolute right-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={applyIdealTurn}
                    className="rounded-md p-1 bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                    aria-label="Apply ideal turn"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelIdealTurn}
                    className="rounded-md p-1 bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                    aria-label="Cancel ideal turn"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </label>

          <label className="flex flex-col text-sm text-muted-foreground">
            <span className="mb-1">From Date</span>
            <input
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
            />
          </label>

          <label className="flex flex-col text-sm text-muted-foreground">
            <span className="mb-1">To Date</span>
            <input
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
            />
          </label>

          <div className="flex flex-col">
            <span className="mb-1 text-sm text-muted-foreground">View Mode</span>
            <div className="flex items-center gap-1 rounded-md border bg-background p-1">
              <Button
                variant={displayMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("grid")}
                className="h-8 flex-1"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={displayMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setDisplayMode("table")}
                className="h-8 flex-1"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="mb-1 text-sm text-muted-foreground">Filters</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsFilterDrawerOpen(true)} className="h-9 flex-1">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && <span className="ml-2 text-xs text-primary">(Active)</span>}
              </Button>
              <SavedFiltersDropdown
                savedFilters={savedFilters}
                onLoad={handleLoadFilter}
                onDelete={handleDeleteFilter}
              />
            </div>
          </div>
        </div>
      </section>

      {hasActiveFilters && (
        <section className="rounded-lg border bg-card p-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setFilters({ ...defaultFilters })}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSaveFilterDialogOpen(true)}>
              <Save className="h-4 w-4 mr-1" />
              Save Filter
            </Button>
            <FilterBadges filters={filters} onRemoveFilter={handleRemoveFilter} />
          </div>
        </section>
      )}

      <section className="rounded-lg border bg-card p-3">
        <SummaryCards rows={view === "l1" ? l1FlatRows : l2FlatRows} avg={avg} />
      </section>

      {view === "l1" && displayMode === "grid" && (
        <section className="rounded-lg border bg-card p-3">
          <div className="mb-2 text-center text-sm font-semibold">Level 1 — Carat Range × Type</div>
          <HeatMatrix
            rowHeader="Carat Range \\ Type"
            rows={caratRanges}
            cols={types}
            getCell={(r, c) => filteredL1Data?.data?.[r]?.[c]}
            metric={metric}
            allValues={l1AllValues}
            idealTurn={idealTurn}
            onCellClick={(r, c) => openL2(c, r)}
            titleForCell={formatTooltip}
          />
        </section>
      )}

      {view === "l1" && displayMode === "table" && (
        <section className="rounded-lg border bg-card p-3">
          <div className="mb-3 text-center text-sm font-semibold">All Data — Table View</div>
          <DataTableView
            types={types}
            caratRanges={caratRanges}
            L2={tableData?.data || {}}
            filters={filters}
            onRowClick={openDetails}
          />
        </section>
      )}

      {view === "l2" && (
        <section className="space-y-3">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold">Level 2 — Style No (Code) × Quality</div>
              <div className="flex flex-wrap items-center gap-3">
                {displayMode === "grid" && (
                  <>
                    <label className="text-sm text-muted-foreground">
                      Type:
                      <select
                        className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
                        value={l2Type}
                        onChange={(e) => setL2Type(e.target.value)}
                      >
                        {types.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm text-muted-foreground">
                      Carat Range:
                      <select
                        className="ml-2 rounded-md border bg-background px-2 py-1 text-sm"
                        value={l2CR}
                        onChange={(e) => setL2CR(e.target.value)}
                      >
                        {caratRanges.map((cr) => (
                          <option key={cr} value={cr}>
                            {cr}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <Button
                  variant="default"
                  onClick={() => {
                    setView("l1")
                    if (displayMode === "table") {
                      setDisplayMode("grid")
                    }
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>

          {displayMode === "grid" ? (
            <section className="rounded-lg border bg-card p-3">
              <HeatMatrix
                rowHeader="Style No (Code) \\ Quality"
                rows={l2Node?.codes ?? []}
                cols={l2Node?.qualities ?? []}
                getCell={(code, q) => l2Node?.grid?.[code]?.[q]}
                metric={metric}
                allValues={l2AllValues}
                idealTurn={idealTurn}
                onCellClick={(code, q) => openDetails(l2Type, l2CR, code, q)}
                titleForCell={formatTooltip}
              />
            </section>
          ) : (
            <section className="rounded-lg border bg-card p-3">
              <div className="mb-3 text-center text-sm font-semibold">All Data — Table View</div>
              <DataTableView
                types={types}
                caratRanges={caratRanges}
                L2={tableData?.data || {}}
                filters={filters}
                onRowClick={openDetails}
              />
            </section>
          )}
        </section>
      )}

      {view === "details" && (
        <section className="rounded-lg border bg-card p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">
              {`Inventory & Sales Details — ${l2Type} • ${l2CR} • ${detailsCode} • ${detailsQuality}`}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" onClick={() => setView(displayMode === "table" ? "l1" : "l2")}>
                Back
              </Button>
            </div>
          </div>

          <DetailsTables inventoryRows={detailsInventoryRows} salesRows={detailsSalesRows} />
        </section>
      )}

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        availableTypes={availableFilterOptions.types}
        availableCaratRanges={availableFilterOptions.caratRanges}
        availableCodes={availableFilterOptions.codes}
        availableQualities={availableFilterOptions.qualities}
      />

      <SaveFilterDialog
        isOpen={isSaveFilterDialogOpen}
        onClose={() => setIsSaveFilterDialogOpen(false)}
        filters={filters}
        onSave={handleSaveFilter}
      />
    </div>
  )
}
