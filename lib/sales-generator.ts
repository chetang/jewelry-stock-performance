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

  // Categories with higher turn rates will show surplus (negative needs)
  const categoryTurnConfig: Record<string, { mean: number; stdDev: number }> = {
    Studs: { mean: 2.0, stdDev: 0.3 }, // High turn - will show surplus
    Rings: { mean: 1.9, stdDev: 0.35 }, // High turn - will show surplus
    Bracelets: { mean: 1.7, stdDev: 0.3 }, // Moderate-high turn - may show surplus
    // Other categories use default values
  }

  // Default turn values for categories not specified above
  const defaultMeanTurn = 1.25
  const defaultStdDevTurn = 0.35

  inventoryRows.forEach((row) => {
    const seed = row["Serial No."]

    const turnConfig = categoryTurnConfig[row.Type] || {
      mean: defaultMeanTurn,
      stdDev: defaultStdDevTurn,
    }

    // Generate turn value with normal distribution
    let targetTurn = normalRandom(turnConfig.mean, turnConfig.stdDev, seed)
    // Clamp between 0.5 and 3.0 (increased max to allow for higher surplus)
    targetTurn = Math.max(0.5, Math.min(3.0, targetTurn))

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
