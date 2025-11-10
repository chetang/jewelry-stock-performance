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
    date_from: string
    date_to: string
    ideal_turn: number
    item_filters?: {
      type?: string[]
      carat_range?: string[]
      code?: string[]
      quality?: string[]
      memo_status?: string[]
      days_on_memo?: { min: string; max: string }
    }
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn, {
        type: params.item_filters?.type,
        caratRange: params.item_filters?.carat_range,
        styleNo: params.item_filters?.code,
        quality: params.item_filters?.quality,
        memoStatus: params.item_filters?.memo_status,
        daysOnMemo: params.item_filters?.days_on_memo,
      })
      return {
        data: data.L1,
        types: data.types,
        caratRanges: data.caratRanges,
      }
    }

    const result = await apiClient.getLevel1Grid({
      from_date: params.date_from,
      to_date: params.date_to,
      ideal_turn: params.ideal_turn,
      filter_type: params.item_filters?.type,
      filter_carat_range: params.item_filters?.carat_range,
      filter_code: params.item_filters?.code,
      filter_quality: params.item_filters?.quality,
      filter_memo_status: params.item_filters?.memo_status,
      filter_days_on_memo_min: params.item_filters?.days_on_memo?.min,
      filter_days_on_memo_max: params.item_filters?.days_on_memo?.max,
    })

    return result
  },

  async getLevel2Grid(params: {
    date_from: string
    date_to: string
    ideal_turn: number
    type: string
    carat_range: string
    item_filters?: {
      type?: string[]
      carat_range?: string[]
      code?: string[]
      quality?: string[]
      memo_status?: string[]
      days_on_memo?: { min: string; max: string }
    }
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn, {
        type: params.item_filters?.type,
        caratRange: params.item_filters?.carat_range,
        styleNo: params.item_filters?.code,
        quality: params.item_filters?.quality,
        memoStatus: params.item_filters?.memo_status,
        daysOnMemo: params.item_filters?.days_on_memo,
      })
      return {
        data: data.L2,
      }
    }

    return apiClient.getLevel2Grid({
      from_date: params.date_from,
      to_date: params.date_to,
      ideal_turn: params.ideal_turn,
      type: params.type,
      carat_range: params.carat_range,
      filter_type: params.item_filters?.type,
      filter_carat_range: params.item_filters?.carat_range,
      filter_code: params.item_filters?.code,
      filter_quality: params.item_filters?.quality,
      filter_memo_status: params.item_filters?.memo_status,
      filter_days_on_memo_min: params.item_filters?.days_on_memo?.min,
      filter_days_on_memo_max: params.item_filters?.days_on_memo?.max,
    })
  },

  async getLevel3Detail(params: {
    date_from: string
    date_to: string
    ideal_turn: number
    type: string
    carat_range: string
    code?: string
    quality?: string
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn)

      const inventoryRows = data.rawRows.filter(
        (r: any) =>
          r.Type === params.type &&
          r["Carat Range"] === params.carat_range &&
          (!params.code || r.Code === params.code) &&
          (!params.quality || r.Quality === params.quality),
      )

      const salesRows = data.salesRows.filter(
        (s: any) =>
          s.Type === params.type &&
          s["Carat Range"] === params.carat_range &&
          (!params.code || s.Code === params.code) &&
          (!params.quality || s.Quality === params.quality),
      )

      const jobsRows = data.jobsRows.filter(
        (j: any) =>
          j.Type === params.type &&
          j["Carat Range"] === params.carat_range &&
          (!params.code || j.Code === params.code) &&
          (!params.quality || j.Quality === params.quality),
      )

      return {
        stock: inventoryRows,
        jobs: jobsRows,
        sales: salesRows,
        summary: {},
      }
    }

    return apiClient.getLevel3Detail({
      from_date: params.date_from,
      to_date: params.date_to,
      ideal_turn: params.ideal_turn,
      type: params.type,
      carat_range: params.carat_range,
      code: params.code,
      quality: params.quality,
    })
  },

  async getTableView(params: {
    date_from: string
    date_to: string
    ideal_turn: number
    item_filters?: {
      type?: string[]
      carat_range?: string[]
      code?: string[]
      quality?: string[]
      memo_status?: string[]
      days_on_memo?: { min: string; max: string }
    }
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn, {
        type: params.item_filters?.type,
        caratRange: params.item_filters?.carat_range,
        styleNo: params.item_filters?.code,
        quality: params.item_filters?.quality,
        memoStatus: params.item_filters?.memo_status,
        daysOnMemo: params.item_filters?.days_on_memo,
      })

      return {
        data: data.L2,
        types: data.types,
        caratRanges: data.caratRanges,
      }
    }

    return apiClient.getTableView({
      from_date: params.date_from,
      to_date: params.date_to,
      ideal_turn: params.ideal_turn,
      filter_type: params.item_filters?.type,
      filter_carat_range: params.item_filters?.carat_range,
      filter_code: params.item_filters?.code,
      filter_quality: params.item_filters?.quality,
      filter_memo_status: params.item_filters?.memo_status,
      filter_days_on_memo_min: params.item_filters?.days_on_memo?.min,
      filter_days_on_memo_max: params.item_filters?.days_on_memo?.max,
    })
  },

  async getFilterOptions() {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(1.4)
      return {
        types: data.types,
        carat_ranges: data.caratRanges,
        codes: data.styleNos,
        qualities: data.qualities,
      }
    }

    return apiClient.getFilterOptions()
  },

  isMockMode() {
    return USE_MOCK_DATA
  },
}
