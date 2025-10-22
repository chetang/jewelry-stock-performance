export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

export function getColorForValue(
  value: number,
  allValues: number[],
  metric: string,
  idealTurn?: number,
): { bg: string; text: string } {
  // Special handling for needs/surplus
  if (metric === "needs") {
    if (value === 0) {
      return { bg: "#ffffff", text: "#000000" }
    }

    // Separate negative and positive values
    const negatives = allValues.filter((v) => v < 0)
    const positives = allValues.filter((v) => v > 0)

    if (value < 0) {
      // Negative values: 10th percentile is red, 0 is white
      const p10Negative = negatives.length > 0 ? calculatePercentile(negatives, 10) : -1
      const ratio = p10Negative < 0 ? Math.min(1, value / p10Negative) : 0

      // Softer red/pink shades
      const intensity = ratio
      const r = 255
      const g = Math.round(200 - intensity * 100) // 200 to 100
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    } else {
      // Positive values: 0 is white, 90th percentile is green
      const p90Positive = positives.length > 0 ? calculatePercentile(positives, 90) : 1
      const ratio = p90Positive > 0 ? Math.min(1, value / p90Positive) : 0

      // Softer green shades
      const intensity = ratio
      const r = Math.round(200 - intensity * 100) // 200 to 100
      const g = 255
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    }
  }

  if (metric === "turn" && idealTurn !== undefined) {
    // If turn equals ideal turn, return white (neutral)
    if (Math.abs(value - idealTurn) < 0.01) {
      return { bg: "#ffffff", text: "#000000" }
    }

    // Separate values above and below ideal turn
    const aboveIdeal = allValues.filter((v) => v > idealTurn)
    const belowIdeal = allValues.filter((v) => v < idealTurn)

    if (value > idealTurn) {
      // Above ideal: white to green (90th percentile of values > ideal turn)
      const p90Above = aboveIdeal.length > 0 ? calculatePercentile(aboveIdeal, 90) : idealTurn + 1
      const ratio = p90Above > idealTurn ? Math.min(1, (value - idealTurn) / (p90Above - idealTurn)) : 0

      // Green shades
      const intensity = ratio
      const r = Math.round(200 - intensity * 100) // 200 to 100
      const g = 255
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    } else {
      // Below ideal: white to red (10th percentile of values < ideal turn)
      const p10Below = belowIdeal.length > 0 ? calculatePercentile(belowIdeal, 10) : 0
      const ratio = idealTurn > p10Below ? Math.min(1, (idealTurn - value) / (idealTurn - p10Below)) : 0

      // Red shades
      const intensity = ratio
      const r = 255
      const g = Math.round(200 - intensity * 100) // 200 to 100
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    }
  }

  if (metric === "overhang" && idealTurn !== undefined && idealTurn > 0) {
    const neutralOverhang = 365 / idealTurn

    // If overhang equals neutral, return white
    if (Math.abs(value - neutralOverhang) < 1) {
      return { bg: "#ffffff", text: "#000000" }
    }

    // Separate values above and below neutral
    const aboveNeutral = allValues.filter((v) => v > neutralOverhang)
    const belowNeutral = allValues.filter((v) => v < neutralOverhang)

    if (value > neutralOverhang) {
      // Above neutral: white to red (90th percentile of values > neutral)
      const p90Above = aboveNeutral.length > 0 ? calculatePercentile(aboveNeutral, 90) : neutralOverhang + 1
      const ratio =
        p90Above > neutralOverhang ? Math.min(1, (value - neutralOverhang) / (p90Above - neutralOverhang)) : 0

      // Red shades
      const intensity = ratio
      const r = 255
      const g = Math.round(200 - intensity * 100) // 200 to 100
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    } else {
      // Below neutral: white to green (10th percentile of values < neutral)
      const p10Below = belowNeutral.length > 0 ? calculatePercentile(belowNeutral, 10) : 0
      const ratio =
        neutralOverhang > p10Below ? Math.min(1, (neutralOverhang - value) / (neutralOverhang - p10Below)) : 0

      // Green shades
      const intensity = ratio
      const r = Math.round(200 - intensity * 100) // 200 to 100
      const g = 255
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    }
  }

  // For inventory and sales metrics: 0 is white, 90th percentile is green
  if (value === 0) {
    return { bg: "#ffffff", text: "#000000" }
  }

  const p90 = calculatePercentile(allValues, 90)
  const ratio = p90 > 0 ? Math.min(1, value / p90) : 0

  // White to green gradient
  const intensity = ratio
  const r = Math.round(255 - intensity * 155) // 255 to 100
  const g = 255
  const b = Math.round(255 - intensity * 155) // 255 to 100
  return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
}
