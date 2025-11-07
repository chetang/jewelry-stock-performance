import type { InventoryRow } from "./csv-parser"
import { generateSalesData } from "./sales-generator"
import { generateJobsData } from "./jobs-generator"

export type MetricKey =
  | "inventory_count"
  | "inventory_value"
  | "sales_count"
  | "sales_value"
  | "turn"
  | "needs"
  | "inv_aging"
  | "sales_aging"
  | "jobs_count" // Added jobs_count metric
  | "in_house_count" // Added in_house_count metric
  | "on_memo_count" // Added on_memo_count metric
  | "avg_days_on_memo" // Added avg_days_on_memo metric

export type L1Cell = {
  inventory_count?: number
  inventory_value?: number
  sales_count?: number
  sales_value?: number
  turn?: number
  needs?: number
  inv_aging?: number
  sales_aging?: number
  jobs_count?: number // Added jobs_count to L1Cell
  in_house_count?: number // Added in_house_count to L1Cell
  on_memo_count?: number // Added on_memo_count to L1Cell
  avg_days_on_memo?: number // Added avg_days_on_memo to L1Cell
}

export type L2Node = {
  codes: string[]
  qualities: string[]
  grid: Record<string, Record<string, L1Cell>>
}

const TYPE_ORDER = ["Studs", "Bracelets", "Straight Necklace", "Graduated Necklace", "Rings", "Pendants", "Huggies"]

function sortTypes(types: string[]): string[] {
  return types.sort((a, b) => {
    const aIndex = TYPE_ORDER.indexOf(a)
    const bIndex = TYPE_ORDER.indexOf(b)

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.localeCompare(b)
  })
}

function sortCaratRanges(ranges: string[]): string[] {
  return ranges.sort((a, b) => {
    const aStart = Number.parseFloat(a.split("-")[0])
    const bStart = Number.parseFloat(b.split("-")[0])
    return aStart - bStart
  })
}

export function aggregateData(
  rows: InventoryRow[],
  idealTurn = 1.4,
  itemFilters?: {
    type?: string[]
    caratRange?: string[]
    styleNo?: string[]
    quality?: string[]
    memoStatus?: string[]
    daysOnMemo?: { min: string; max: string }
  },
) {
  const salesData = generateSalesData(rows)
  const jobsData = generateJobsData(rows)

  const currentDate = new Date()

  let filteredInventory = rows

  if (itemFilters) {
    if (itemFilters.type && itemFilters.type.length > 0) {
      filteredInventory = filteredInventory.filter((r) => itemFilters.type!.includes(r.Type))
    }
    if (itemFilters.caratRange && itemFilters.caratRange.length > 0) {
      filteredInventory = filteredInventory.filter((r) => itemFilters.caratRange!.includes(r["Carat Range"]))
    }
    if (itemFilters.styleNo && itemFilters.styleNo.length > 0) {
      filteredInventory = filteredInventory.filter((r) => itemFilters.styleNo!.includes(r.Code))
    }
    if (itemFilters.quality && itemFilters.quality.length > 0) {
      filteredInventory = filteredInventory.filter((r) => itemFilters.quality!.includes(r.Quality))
    }
    if (itemFilters.memoStatus && itemFilters.memoStatus.length > 0 && itemFilters.memoStatus.length < 2) {
      filteredInventory = filteredInventory.filter((r) => itemFilters.memoStatus!.includes(r["Memo Status"]))
    }
    if (itemFilters.daysOnMemo) {
      const { min, max } = itemFilters.daysOnMemo
      if (min !== "") {
        filteredInventory = filteredInventory.filter((r) => (r["Days On Memo"] || 0) >= Number.parseFloat(min))
      }
      if (max !== "") {
        filteredInventory = filteredInventory.filter((r) => (r["Days On Memo"] || 0) <= Number.parseFloat(max))
      }
    }
  }

  const typesSet = new Set<string>()
  const caratRangesSet = new Set<string>()

  rows.forEach((row) => {
    typesSet.add(row.Type)
    caratRangesSet.add(row["Carat Range"])
  })

  const types = sortTypes(Array.from(typesSet))
  const caratRanges = sortCaratRanges(Array.from(caratRangesSet))

  const L1: Record<string, Record<string, L1Cell>> = {}

  caratRanges.forEach((cr) => {
    L1[cr] = {}
    types.forEach((type) => {
      const filtered = filteredInventory.filter((r) => r["Carat Range"] === cr && r.Type === type)
      const salesFiltered = salesData.filter((s) => s["Carat Range"] === cr && s.Type === type)
      const jobsFiltered = jobsData.filter((j) => j["Carat Range"] === cr && j.Type === type)

      const inventory_count = filtered.length
      const inventory_value = filtered.reduce((sum, r) => sum + r["Unit Price($)"], 0)

      const sales_count = salesFiltered.length
      const sales_value = salesFiltered.reduce((sum, s) => sum + s["Unit Price($)"], 0)

      const jobs_count = jobsFiltered.length

      const turn = inventory_count > 0 ? Number((sales_count / inventory_count).toFixed(2)) : 0
      const needs = Math.round(idealTurn * inventory_count - sales_count - jobs_count)

      const inv_aging =
        filtered.length > 0
          ? Math.round(
              filtered.reduce((sum, r) => {
                const createdDate = new Date(r["Date Created"])
                const daysSinceCreated = Math.floor(
                  (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
                )
                return sum + daysSinceCreated
              }, 0) / filtered.length,
            )
          : 0

      const sales_aging =
        salesFiltered.length > 0
          ? Math.round(salesFiltered.reduce((sum, s) => sum + s["Aging (days)"], 0) / salesFiltered.length)
          : 0

      const inHouseCount = filtered.filter((r) => r["Memo Status"] === "In-House").length
      const onMemoCount = filtered.filter((r) => r["Memo Status"] === "On-Memo").length
      const memoItems = filtered.filter((r) => r["Memo Status"] === "On-Memo" && r["Days On Memo"])
      const avgDaysOnMemo =
        memoItems.length > 0
          ? Math.round(memoItems.reduce((sum, r) => sum + (r["Days On Memo"] || 0), 0) / memoItems.length)
          : 0

      L1[cr][type] = {
        inventory_count,
        inventory_value,
        sales_count,
        sales_value,
        turn,
        needs,
        inv_aging,
        sales_aging,
        jobs_count,
        in_house_count: inHouseCount,
        on_memo_count: onMemoCount,
        avg_days_on_memo: avgDaysOnMemo,
      }
    })
  })

  const L2: Record<string, L2Node> = {}

  types.forEach((type) => {
    caratRanges.forEach((cr) => {
      const filtered = filteredInventory.filter((r) => r.Type === type && r["Carat Range"] === cr)
      const salesFiltered = salesData.filter((s) => s.Type === type && s["Carat Range"] === cr)
      const jobsFiltered = jobsData.filter((j) => j.Type === type && j["Carat Range"] === cr)

      if (filtered.length === 0) return

      const codesSet = new Set<string>()
      const qualitiesSet = new Set<string>()

      filtered.forEach((row) => {
        codesSet.add(row.Code)
        qualitiesSet.add(row.Quality)
      })

      const codes = Array.from(codesSet).sort()
      const qualities = Array.from(qualitiesSet).sort()

      const grid: Record<string, Record<string, L1Cell>> = {}

      codes.forEach((code) => {
        grid[code] = {}
        qualities.forEach((quality) => {
          const cellRows = filtered.filter((r) => r.Code === code && r.Quality === quality)
          const cellSales = salesFiltered.filter((s) => s.Code === code && s.Quality === quality)
          const cellJobs = jobsFiltered.filter((j) => j.Code === code && j.Quality === quality)

          const inventory_count = cellRows.length
          const inventory_value = cellRows.reduce((sum, r) => sum + r["Unit Price($)"], 0)

          const sales_count = cellSales.length
          const sales_value = cellSales.reduce((sum, s) => sum + s["Unit Price($)"], 0)

          const jobs_count = cellJobs.length

          const turn = inventory_count > 0 ? Number((sales_count / inventory_count).toFixed(2)) : 0
          const needs = Math.round(idealTurn * inventory_count - sales_count - jobs_count)

          const inv_aging =
            cellRows.length > 0
              ? Math.round(
                  cellRows.reduce((sum, r) => {
                    const createdDate = new Date(r["Date Created"])
                    const daysSinceCreated = Math.floor(
                      (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
                    )
                    return sum + daysSinceCreated
                  }, 0) / cellRows.length,
                )
              : 0

          const sales_aging =
            cellSales.length > 0
              ? Math.round(cellSales.reduce((sum, s) => sum + s["Aging (days)"], 0) / cellSales.length)
              : 0

          // Calculate memo statistics for L2 grid
          const cellInHouseCount = cellRows.filter((r) => r["Memo Status"] === "In-House").length
          const cellOnMemoCount = cellRows.filter((r) => r["Memo Status"] === "On-Memo").length
          const cellMemoItems = cellRows.filter((r) => r["Memo Status"] === "On-Memo" && r["Days On Memo"])
          const cellAvgDaysOnMemo =
            cellMemoItems.length > 0
              ? Math.round(cellMemoItems.reduce((sum, r) => sum + (r["Days On Memo"] || 0), 0) / cellMemoItems.length)
              : 0

          grid[code][quality] = {
            inventory_count,
            inventory_value,
            sales_count,
            sales_value,
            turn,
            needs,
            inv_aging,
            sales_aging,
            jobs_count,
            in_house_count: cellInHouseCount,
            on_memo_count: cellOnMemoCount,
            avg_days_on_memo: cellAvgDaysOnMemo,
          }
        })
      })

      const key = `${type}||${cr}`
      L2[key] = { codes, qualities, grid }
    })
  })

  return { types, caratRanges, L1, L2, rawRows: rows, salesRows: salesData, jobsRows: jobsData }
}
