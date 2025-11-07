import { fetchAndParseCSV } from "./csv-parser"
import { aggregateData } from "./data-aggregator"
import { apiClient } from "./api-client"

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/finished_jewelry_stock-TvWqIbTfX4QPpGOOAvKGHoRxsRCBJo.csv"

let mockDataCache: any = null

function generateMemoData(rows: any[]): any[] {
  const today = new Date()

  return rows.map((row) => {
    const isOnMemo = Math.random() < 0.3

    if (isOnMemo) {
      const daysAgo = Math.floor(Math.random() * 180)
      const shipmentDate = new Date(today)
      shipmentDate.setDate(shipmentDate.getDate() - daysAgo)

      const daysOnMemo = Math.floor((today.getTime() - shipmentDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...row,
        "Memo Status": "On-Memo" as const,
        "Shipment Date": shipmentDate.toISOString().split("T")[0],
        "Days On Memo": daysOnMemo,
      }
    }

    return {
      ...row,
      "Memo Status": "In-House" as const,
    }
  })
}

async function loadMockData(
  idealTurn: number,
  itemFilters?: {
    type?: string[]
    caratRange?: string[]
    styleNo?: string[]
    quality?: string[]
    memoStatus?: string[]
    daysOnMemo?: { min: string; max: string }
  },
) {
  if (!mockDataCache) {
    const rows = await fetchAndParseCSV(CSV_URL)
    const rowsWithMemo = generateMemoData(rows)
    mockDataCache = { rawRows: rowsWithMemo }
  }

  const aggregated = aggregateData(mockDataCache.rawRows, idealTurn, itemFilters)
  return { ...aggregated, rawRows: mockDataCache.rawRows }
}

export const dataService = {
  async getLevel1Grid(params: {
    metric: string
    date_from: string
    date_to: string
    ideal_turn: number
    item_filters?: {
      type?: string[]
      carat_range?: string[]
      style_no?: string[]
      quality?: string[]
      memo_status?: string[]
      days_on_memo?: { min: string; max: string }
    }
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn, params.item_filters)
      return {
        data: data.L1,
        types: data.types,
        caratRanges: data.caratRanges,
      }
    }
    return apiClient.getLevel1Grid(params)
  },

  async getLevel2Grid(params: {
    metric: string
    date_from: string
    date_to: string
    ideal_turn: number
    category: string
    carat_range: string
    item_filters?: {
      type?: string[]
      carat_range?: string[]
      style_no?: string[]
      quality?: string[]
      memo_status?: string[]
      days_on_memo?: { min: string; max: string }
    }
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn, params.item_filters)
      return {
        data: data.L2,
      }
    }
    return apiClient.getLevel2Grid(params)
  },

  async getLevel3Detail(params: {
    date_from: string
    date_to: string
    ideal_turn: number
    category: string
    carat_range: string
    sub_category: string
    quality: string
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn)

      // Filter inventory, sales, and jobs for the specific combination
      const inventoryRows = data.rawRows.filter(
        (r: any) =>
          r.Type === params.category &&
          r["Carat Range"] === params.carat_range &&
          r.Code === params.sub_category &&
          r.Quality === params.quality,
      )

      const salesRows = data.salesRows.filter(
        (s: any) =>
          s.Type === params.category &&
          s["Carat Range"] === params.carat_range &&
          s.Code === params.sub_category &&
          s.Quality === params.quality,
      )

      const jobsRows = data.jobsRows.filter(
        (j: any) =>
          j.Type === params.category &&
          j["Carat Range"] === params.carat_range &&
          j.Code === params.sub_category &&
          j.Quality === params.quality,
      )

      return {
        data: {
          inventoryRows,
          salesRows,
          jobsRows,
        },
      }
    }
    return apiClient.getLevel3Detail(params)
  },

  async getTableView(params: {
    metric: string
    date_from: string
    date_to: string
    ideal_turn: number
    item_filters?: {
      type?: string[]
      carat_range?: string[]
      style_no?: string[]
      quality?: string[]
      memo_status?: string[]
      days_on_memo?: { min: string; max: string }
    }
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn, params.item_filters)

      return {
        data: data.L2,
        types: data.types,
        caratRanges: data.caratRanges,
      }
    }
    return apiClient.getTableView(params)
  },

  isMockMode() {
    return USE_MOCK_DATA
  },
}
