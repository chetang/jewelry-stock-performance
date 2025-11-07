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
  if (allValues.length === 0) {
    return { bg: "#ffffff", text: "#000000" }
  }

  // Check if all values are the same or very similar (within 1% range)
  const min = Math.min(...allValues)
  const max = Math.max(...allValues)
  const range = max - min
  const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length

  // If range is very small (less than 1% of average), use neutral color
  if (range < Math.abs(avgValue) * 0.01 || range === 0) {
    return { bg: "#ffffff", text: "#000000" }
  }

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

      if (p10Negative === 0 || Math.abs(p10Negative - value) < 0.01) {
        return { bg: "#ffcccc", text: "#000000" }
      }

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

      if (p90Positive === 0 || Math.abs(p90Positive - value) < 0.01) {
        return { bg: "#ccffcc", text: "#000000" }
      }

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

      if (Math.abs(p90Above - idealTurn) < 0.01 || Math.abs(p90Above - value) < 0.01) {
        return { bg: "#ccffcc", text: "#000000" }
      }

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

      if (Math.abs(idealTurn - p10Below) < 0.01 || Math.abs(value - p10Below) < 0.01) {
        return { bg: "#ffcccc", text: "#000000" }
      }

      const ratio = idealTurn > p10Below ? Math.min(1, (idealTurn - value) / (idealTurn - p10Below)) : 0

      // Red shades
      const intensity = ratio
      const r = 255
      const g = Math.round(200 - intensity * 100) // 200 to 100
      const b = Math.round(200 - intensity * 100) // 200 to 100
      return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
    }
  }

  // For inventory and sales metrics: 0 is white, 90th percentile is green
  if (value === 0) {
    return { bg: "#ffffff", text: "#000000" }
  }

  const p90 = calculatePercentile(allValues, 90)

  if (p90 === 0 || Math.abs(p90 - value) < Math.abs(p90) * 0.01) {
    return { bg: "#ccffcc", text: "#000000" }
  }

  const ratio = p90 > 0 ? Math.min(1, value / p90) : 0

  // White to green gradient
  const intensity = ratio
  const r = Math.round(255 - intensity * 155) // 255 to 100
  const g = 255
  const b = Math.round(255 - intensity * 155) // 255 to 100
  return { bg: `rgb(${r}, ${g}, ${b})`, text: "#000000" }
}
