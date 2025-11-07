"use client"

import { X } from "lucide-react"
import type { FilterState } from "./filter-drawer"

interface FilterBadgesProps {
  filters: FilterState
  onRemoveFilter: (key: string, value?: string) => void
}

export function FilterBadges({ filters, onRemoveFilter }: FilterBadgesProps) {
  const badges: Array<{ label: string; onRemove: () => void }> = []

  filters.type.forEach((value) => {
    badges.push({
      label: `Type: ${value}`,
      onRemove: () => onRemoveFilter("type", value),
    })
  })

  filters.caratRange.forEach((value) => {
    badges.push({
      label: `Carat: ${value}`,
      onRemove: () => onRemoveFilter("caratRange", value),
    })
  })

  filters.code.forEach((value) => {
    badges.push({
      label: `Style No: ${value}`,
      onRemove: () => onRemoveFilter("code", value),
    })
  })

  filters.quality.forEach((value) => {
    badges.push({
      label: `Quality: ${value}`,
      onRemove: () => onRemoveFilter("quality", value),
    })
  })

  filters.memoStatus.forEach((value) => {
    badges.push({
      label: `Status: ${value}`,
      onRemove: () => onRemoveFilter("memoStatus", value),
    })
  })

  const numericFilters: Array<{
    key: keyof Omit<FilterState, "type" | "caratRange" | "code" | "quality" | "memoStatus" | "includeJobs">
    label: string
  }> = [
    { key: "inventoryCount", label: "Inv. Count" },
    { key: "inventoryValue", label: "Inv. Value" },
    { key: "salesCount", label: "Sales Count" },
    { key: "salesValue", label: "Sales Value" },
    { key: "jobsCount", label: "Jobs Count" },
    { key: "turn", label: "Turn" },
    { key: "needs", label: "Needs/Surplus" },
    { key: "invAging", label: "Inv. Aging" },
    { key: "salesAging", label: "Sales Aging" },
    { key: "daysOnMemo", label: "Days On Memo" },
  ]

  numericFilters.forEach(({ key, label }) => {
    const filter = filters[key]
    if (filter.min !== "" || filter.max !== "") {
      const rangeText =
        filter.min !== "" && filter.max !== ""
          ? `${filter.min}-${filter.max}`
          : filter.min !== ""
            ? `≥${filter.min}`
            : `≤${filter.max}`
      badges.push({
        label: `${label}: ${rangeText}`,
        onRemove: () => onRemoveFilter(key),
      })
    }
  })

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((badge, index) => (
        <span key={index} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
          {badge.label}
          <button
            type="button"
            onClick={badge.onRemove}
            className="hover:text-primary/80"
            aria-label={`Remove ${badge.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  )
}
