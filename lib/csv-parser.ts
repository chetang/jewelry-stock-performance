export type InventoryRow = {
  Type: string
  "Serial No.": number
  "Item No.": string
  Code: string
  "Carat Code": number
  "Carat Range": string
  "Gold Color": string
  Quality: string
  "Total Carat Weight": number
  "Date Created": string
  Description: string
  "Unit Price($)": number
}

export async function fetchAndParseCSV(url: string): Promise<InventoryRow[]> {
  const response = await fetch(url)
  const text = await response.text()

  const lines = text.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))

  const rows: InventoryRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    // Parse CSV line handling quoted values
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: any = {}
    headers.forEach((header, idx) => {
      const value = values[idx] || ""

      // Parse based on header name
      if (header === "Serial No." || header === "Carat Code") {
        row[header] = Number.parseInt(value) || 0
      } else if (header === "Total Carat Weight") {
        row[header] = Number.parseFloat(value) || 0
      } else if (header === "Unit Price($)") {
        // Remove $ and commas, parse as number
        const cleaned = value.replace(/[$,\s]/g, "")
        row[header] = Number.parseFloat(cleaned) || 0
      } else {
        row[header] = value
      }
    })

    rows.push(row as InventoryRow)
  }

  return rows
}
