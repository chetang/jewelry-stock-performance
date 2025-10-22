import type { InventoryRow } from "./csv-parser"

export type SalesRow = {
  Type: string
  "Serial No.": number
  "Item No.": string
  Code: string
  "Carat Range": string
  Quality: string
  "Date Created": string
  "Sold Date": string
  "Unit Price($)": number
  "Aging (days)": number
}

function normalRandom(mean: number, stdDev: number, seed: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.abs((Math.sin(seed * 9301 + 49297) % 233280) / 233280)
  const u2 = Math.abs((Math.sin((seed + 1) * 9301 + 49297) % 233280) / 233280)
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z0 * stdDev
}

export function generateSalesData(inventoryRows: InventoryRow[]): SalesRow[] {
  const salesRows: SalesRow[] = []
  const today = new Date()

  // Target: Turn values between 0.5 and 2.0 with normal distribution
  // Mean turn: 1.25, Std Dev: 0.35 (gives good spread between 0.5-2.0)
  const meanTurn = 1.25
  const stdDevTurn = 0.35

  inventoryRows.forEach((row) => {
    const seed = row["Serial No."]

    // Generate turn value with normal distribution
    let targetTurn = normalRandom(meanTurn, stdDevTurn, seed)
    // Clamp between 0.5 and 2.0
    targetTurn = Math.max(0.5, Math.min(2.0, targetTurn))

    // Calculate target aging based on turn: aging = 365 / turn
    const targetAging = Math.round(365 / targetTurn)

    const createdDate = new Date(row["Date Created"])
    const daysSinceCreated = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    // Determine if item should be sold based on aging
    // Items with lower target aging (higher turn) are more likely to have sold
    const shouldSell = daysSinceCreated >= targetAging * 0.8 // Sell if 80% of target aging has passed

    if (shouldSell) {
      // Add some variance to the actual aging (±20%)
      const agingVariance = normalRandom(0, 0.15, seed + 1000)
      const actualAging = Math.max(1, Math.min(Math.round(targetAging * (1 + agingVariance)), daysSinceCreated))

      const soldDate = new Date(createdDate)
      soldDate.setDate(soldDate.getDate() + actualAging)

      salesRows.push({
        Type: row.Type,
        "Serial No.": row["Serial No."],
        "Item No.": row["Item No."],
        Code: row.Code,
        "Carat Range": row["Carat Range"],
        Quality: row.Quality,
        "Date Created": row["Date Created"],
        "Sold Date": soldDate.toLocaleDateString("en-US"),
        "Unit Price($)": row["Unit Price($)"],
        "Aging (days)": actualAging,
      })
    }
  })

  return salesRows
}
