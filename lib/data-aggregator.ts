import type { InventoryRow } from "./csv-parser"
import { generateSalesData } from "./sales-generator"

export type MetricKey =
  | "inventory_count"
  | "inventory_value"
  | "sales_count"
  | "sales_value"
  | "turn"
  | "needs"
  | "overhang"
  | "inv_aging"
  | "sales_aging"

export type L1Cell = {
  inventory_count?: number
  inventory_value?: number
  sales_count?: number
  sales_value?: number
  turn?: number
  needs?: number
  overhang?: number
  inv_aging?: number
  sales_aging?: number
}

export type L2Node = {
  codes: string[]
  qualities: string[]
  grid: Record<string, Record<string, L1Cell>>
}

const TYPE_ORDER = ["Studs", "Rings", "Bracelets", "Necklaces", "Pendants", "Huggies"]

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
    // Extract the starting carat value from each range (e.g., "1.70-1.79" → 1.70)
    const aStart = Number.parseFloat(a.split("-")[0])
    const bStart = Number.parseFloat(b.split("-")[0])
    return aStart - bStart
  })
}

export function aggregateData(rows: InventoryRow[], idealTurn = 2.5) {
  const salesData = generateSalesData(rows)

  const currentDate = new Date()

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
      const filtered = rows.filter((r) => r["Carat Range"] === cr && r.Type === type)
      const salesFiltered = salesData.filter((s) => s["Carat Range"] === cr && s.Type === type)

      const inventory_count = filtered.length
      const inventory_value = filtered.reduce((sum, r) => sum + r["Unit Price($)"], 0)

      const sales_count = salesFiltered.length
      const sales_value = salesFiltered.reduce((sum, s) => sum + s["Unit Price($)"], 0)

      const turn = inventory_count > 0 ? Number((sales_count / inventory_count).toFixed(2)) : 0
      const needs = Math.round(idealTurn * inventory_count - sales_count)

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

      const overhang = sales_aging

      L1[cr][type] = {
        inventory_count,
        inventory_value,
        sales_count,
        sales_value,
        turn,
        needs,
        overhang,
        inv_aging,
        sales_aging,
      }
    })
  })

  const L2: Record<string, L2Node> = {}

  types.forEach((type) => {
    caratRanges.forEach((cr) => {
      const filtered = rows.filter((r) => r.Type === type && r["Carat Range"] === cr)
      const salesFiltered = salesData.filter((s) => s.Type === type && s["Carat Range"] === cr)

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

          const inventory_count = cellRows.length
          const inventory_value = cellRows.reduce((sum, r) => sum + r["Unit Price($)"], 0)

          const sales_count = cellSales.length
          const sales_value = cellSales.reduce((sum, s) => sum + s["Unit Price($)"], 0)

          const turn = inventory_count > 0 ? Number((sales_count / inventory_count).toFixed(2)) : 0
          const needs = Math.round(idealTurn * inventory_count - sales_count)

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

          const overhang = sales_aging

          grid[code][quality] = {
            inventory_count,
            inventory_value,
            sales_count,
            sales_value,
            turn,
            needs,
            overhang,
            inv_aging,
            sales_aging,
          }
        })
      })

      const key = `${type}||${cr}`
      L2[key] = { codes, qualities, grid }
    })
  })

  return { types, caratRanges, L1, L2, rawRows: rows, salesRows: salesData }
}
