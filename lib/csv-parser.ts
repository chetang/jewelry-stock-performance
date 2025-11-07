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
  "Memo Status": "In-House" | "On-Memo"
  "Shipment Date"?: string
  "Days On Memo"?: number
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
      } else if (header === "Memo Status") {
        row[header] = value as "In-House" | "On-Memo"
      } else if (header === "Shipment Date") {
        row[header] = value
      } else if (header === "Days On Memo") {
        row[header] = Number.parseInt(value) || 0
      } else {
        row[header] = value
      }
    })

    if (row["Total Carat Weight"]) {
      row["Carat Range"] = mapCaratRange(row["Total Carat Weight"])
    }

    rows.push(row as InventoryRow)
  }

  return rows
}

export function mapCaratRange(caratWeight: number): string {
  if (caratWeight >= 0.7 && caratWeight <= 0.79) return "0.70-0.79"
  if (caratWeight >= 0.8 && caratWeight <= 0.89) return "0.80-0.89"
  if (caratWeight >= 0.9 && caratWeight <= 0.97) return "0.90-0.97"
  if (caratWeight >= 1.4 && caratWeight <= 1.69) return "1.40-1.69"
  if (caratWeight >= 1.7 && caratWeight <= 1.99) return "1.70-1.99"
  if (caratWeight >= 2.7 && caratWeight <= 2.99) return "2.70-2.99"
  if (caratWeight >= 3.4 && caratWeight <= 3.69) return "3.40-3.69"
  if (caratWeight >= 3.7 && caratWeight <= 3.99) return "3.70-3.99"
  if (caratWeight >= 4.0 && caratWeight <= 4.19) return "4.00-4.19"
  if (caratWeight >= 4.4 && caratWeight <= 4.69) return "4.40-4.69"
  if (caratWeight >= 4.7 && caratWeight <= 4.99) return "4.70-4.99"
  if (caratWeight >= 5.0 && caratWeight <= 5.19) return "5.00-5.19"
  if (caratWeight >= 5.4 && caratWeight <= 5.69) return "5.40-5.69"
  if (caratWeight >= 5.7 && caratWeight <= 5.99) return "5.70-5.99"
  if (caratWeight >= 6.0 && caratWeight <= 6.19) return "6.00-6.19"
  if (caratWeight >= 6.4 && caratWeight <= 6.69) return "6.40-6.69"
  if (caratWeight >= 6.7 && caratWeight <= 6.99) return "6.70-6.99"
  if (caratWeight >= 7.0 && caratWeight <= 7.19) return "7.00-7.19"
  if (caratWeight >= 7.4 && caratWeight <= 7.69) return "7.40-7.69"
  if (caratWeight >= 7.7 && caratWeight <= 7.99) return "7.70-7.99"
  if (caratWeight >= 8.0 && caratWeight <= 8.19) return "8.00-8.19"
  if (caratWeight >= 8.4 && caratWeight <= 8.69) return "8.40-8.69"
  if (caratWeight >= 8.7 && caratWeight <= 8.99) return "8.70-8.99"
  if (caratWeight >= 9.0 && caratWeight <= 9.19) return "9.00-9.19"
  if (caratWeight >= 9.4 && caratWeight <= 9.69) return "9.40-9.69"
  if (caratWeight >= 9.7 && caratWeight <= 9.99) return "9.70-9.99"
  if (caratWeight >= 10.0 && caratWeight <= 10.19) return "10.00-10.19"
  if (caratWeight >= 10.4 && caratWeight <= 10.69) return "10.40-10.69"
  if (caratWeight >= 10.7 && caratWeight <= 10.99) return "10.70-10.99"

  return "Other"
}
