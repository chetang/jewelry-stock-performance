"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { InventoryRow } from "@/lib/csv-parser"
import type { SalesRow } from "@/lib/sales-generator"

export function DetailsTables({
  inventoryRows,
  salesRows,
}: {
  inventoryRows: InventoryRow[]
  salesRows: SalesRow[]
}) {
  const [invPage, setInvPage] = useState(1)
  const [invPageSize, setInvPageSize] = useState(50)
  const [salesPage, setSalesPage] = useState(1)
  const [salesPageSize, setSalesPageSize] = useState(50)

  const invCount = inventoryRows.length
  const invValue = inventoryRows.reduce((sum, r) => sum + r["Unit Price($)"], 0)
  const invAvgAging =
    inventoryRows.length > 0
      ? Math.round(
          inventoryRows.reduce((sum, r) => {
            const created = new Date(r["Date Created"])
            const today = new Date()
            const days = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
            return sum + days
          }, 0) / inventoryRows.length,
        )
      : 0

  const salesCount = salesRows.length
  const salesValue = salesRows.reduce((sum, r) => sum + r["Unit Price($)"], 0)
  const salesAvgAging =
    salesRows.length > 0 ? Math.round(salesRows.reduce((sum, r) => sum + r["Aging (days)"], 0) / salesRows.length) : 0

  const invTotalPages = Math.ceil(inventoryRows.length / invPageSize)
  const paginatedInvRows = useMemo(() => {
    const startIndex = (invPage - 1) * invPageSize
    return inventoryRows.slice(startIndex, startIndex + invPageSize)
  }, [inventoryRows, invPage, invPageSize])

  const salesTotalPages = Math.ceil(salesRows.length / salesPageSize)
  const paginatedSalesRows = useMemo(() => {
    const startIndex = (salesPage - 1) * salesPageSize
    return salesRows.slice(startIndex, startIndex + salesPageSize)
  }, [salesRows, salesPage, salesPageSize])

  const invCols: (keyof InventoryRow)[] = [
    "Type",
    "Serial No.",
    "Item No.",
    "Code",
    "Carat Code",
    "Carat Range",
    "Gold Color",
    "Quality",
    "Total Carat Weight",
    "Date Created",
    "Description",
    "Unit Price($)",
  ]

  const salesCols: (keyof SalesRow)[] = [
    "Type",
    "Serial No.",
    "Item No.",
    "Code",
    "Carat Range",
    "Quality",
    "Date Created",
    "Sold Date",
    "Unit Price($)",
    "Aging (days)",
  ]

  function downloadInventoryCSV() {
    const headers = invCols.map(String)
    const rows = inventoryRows.map((row) =>
      invCols.map((col) => {
        const value = row[col]
        if (col === "Unit Price($)") {
          return Math.round(value as number)
        }
        return String(value)
      }),
    )

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadSalesCSV() {
    const headers = salesCols.map(String)
    const rows = salesRows.map((row) =>
      salesCols.map((col) => {
        const value = row[col]
        if (col === "Unit Price($)") {
          return Math.round(value as number)
        }
        return String(value)
      }),
    )

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function PaginationControls({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
  }: {
    currentPage: number
    totalPages: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }) {
    const maxVisiblePages = 5
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

    return (
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
              onPageChange(1)
            }}
            className="rounded border bg-background px-2 py-1"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
          <span className="ml-4 text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="rounded border bg-background px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded border bg-background p-1 hover:bg-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`rounded border px-3 py-1 text-xs ${
                currentPage === page ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded border bg-background p-1 hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="rounded border bg-background px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Inventory Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">Inventory</div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs">
              <div className="text-muted-foreground">
                Count: <span className="font-semibold text-foreground">{invCount.toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">
                Value: <span className="font-semibold text-foreground">${Math.round(invValue).toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">
                Avg Aging: <span className="font-semibold text-foreground">{invAvgAging} days</span>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadInventoryCSV}
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="max-h-[650px] overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {invCols.map((c) => (
                    <th key={String(c)} className="sticky top-0 z-10 border bg-muted px-2 py-1 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedInvRows.map((r, i) => (
                  <tr key={i}>
                    {invCols.map((c) => {
                      let value = String(r[c])
                      if (c === "Unit Price($)") {
                        value = Math.round(r[c]).toLocaleString()
                      }
                      return (
                        <td key={String(c)} className="border px-2 py-1">
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {paginatedInvRows.length === 0 && (
                  <tr>
                    <td className="border px-2 py-2 text-muted-foreground" colSpan={invCols.length}>
                      No inventory rows for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={invPage}
            totalPages={invTotalPages}
            pageSize={invPageSize}
            totalItems={inventoryRows.length}
            onPageChange={setInvPage}
            onPageSizeChange={setInvPageSize}
          />
        </div>
      </div>

      {/* Sales Section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-semibold">Sales</div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs">
              <div className="text-muted-foreground">
                Count: <span className="font-semibold text-foreground">{salesCount.toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">
                Value: <span className="font-semibold text-foreground">${Math.round(salesValue).toLocaleString()}</span>
              </div>
              <div className="text-muted-foreground">
                Avg Aging: <span className="font-semibold text-foreground">{salesAvgAging} days</span>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadSalesCSV}
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <div className="max-h-[650px] overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {salesCols.map((c) => (
                    <th key={String(c)} className="sticky top-0 z-10 border bg-muted px-2 py-1 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedSalesRows.map((r, i) => (
                  <tr key={i}>
                    {salesCols.map((c) => {
                      let value = String(r[c])
                      if (c === "Unit Price($)") {
                        value = Math.round(r[c]).toLocaleString()
                      }
                      return (
                        <td key={String(c)} className="border px-2 py-1">
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {paginatedSalesRows.length === 0 && (
                  <tr>
                    <td className="border px-2 py-2 text-muted-foreground" colSpan={salesCols.length}>
                      No sales for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={salesPage}
            totalPages={salesTotalPages}
            pageSize={salesPageSize}
            totalItems={salesRows.length}
            onPageChange={setSalesPage}
            onPageSizeChange={setSalesPageSize}
          />
        </div>
      </div>
    </div>
  )
}
