import { fetchAndParseCSV } from "./csv-parser"
import { aggregateData } from "./data-aggregator"
import { apiClient } from "./api-client"

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
const CSV_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/finished_jewelry_stock-TvWqIbTfX4QPpGOOAvKGHoRxsRCBJo.csv"

let mockDataCache: any = null

async function loadMockData(idealTurn: number) {
  if (!mockDataCache) {
    const rows = await fetchAndParseCSV(CSV_URL)
    mockDataCache = aggregateData(rows, idealTurn)
  } else if (mockDataCache.idealTurn !== idealTurn) {
    // Recalculate with new ideal turn
    mockDataCache = aggregateData(mockDataCache.rawRows, idealTurn)
  }
  return mockDataCache
}

export const dataService = {
  async getLevel1Grid(params: {
    metric: string
    date_from: string
    date_to: string
    ideal_turn: number
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn)
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
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn)
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

      // Filter inventory and sales for the specific combination
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

      return {
        data: {
          inventoryRows,
          salesRows,
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
  }) {
    if (USE_MOCK_DATA) {
      const data = await loadMockData(params.ideal_turn)

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
