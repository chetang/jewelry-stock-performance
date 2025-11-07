"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

export type FilterState = {
  type: string[]
  caratRange: string[]
  code: string[]
  quality: string[]
  memoStatus: string[]
  daysOnMemo: { min: string; max: string }
  inventoryCount: { min: string; max: string }
  inventoryValue: { min: string; max: string }
  salesCount: { min: string; max: string }
  salesValue: { min: string; max: string }
  jobsCount: { min: string; max: string }
  turn: { min: string; max: string }
  needs: { min: string; max: string }
  invAging: { min: string; max: string }
  salesAging: { min: string; max: string }
}

export const defaultFilters: FilterState = {
  type: [],
  caratRange: [],
  code: [],
  quality: [],
  memoStatus: [],
  daysOnMemo: { min: "", max: "" },
  inventoryCount: { min: "", max: "" },
  inventoryValue: { min: "", max: "" },
  salesCount: { min: "", max: "" },
  salesValue: { min: "", max: "" },
  jobsCount: { min: "", max: "" },
  turn: { min: "", max: "" },
  needs: { min: "", max: "" },
  invAging: { min: "", max: "" },
  salesAging: { min: "", max: "" },
}

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  availableTypes: string[]
  availableCaratRanges: string[]
  availableCodes: string[]
  availableQualities: string[]
}

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableTypes,
  availableCaratRanges,
  availableCodes,
  availableQualities,
}: FilterDrawerProps) {
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters)

  useEffect(() => {
    if (isOpen) {
      setPendingFilters(filters)
    }
  }, [isOpen, filters])

  function toggleDropdownFilter(key: "type" | "caratRange" | "code" | "quality" | "memoStatus", value: string) {
    const current = pendingFilters[key]
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setPendingFilters({ ...pendingFilters, [key]: updated })
  }

  function updateMinMaxFilter(
    key: keyof Omit<FilterState, "type" | "caratRange" | "code" | "quality" | "memoStatus">,
    field: "min" | "max",
    value: string,
  ) {
    setPendingFilters({
      ...pendingFilters,
      [key]: { ...pendingFilters[key], [field]: value },
    })
  }

  function clearAllFilters() {
    setPendingFilters(defaultFilters)
  }

  function applyFilters() {
    onFiltersChange(pendingFilters)
    onClose()
  }

  function handleClose() {
    setPendingFilters(filters) // Reset to current filters
    onClose()
  }

  function MultiSelectDropdown({
    label,
    options,
    selected,
    onToggle,
  }: {
    label: string
    options: string[]
    selected: string[]
    onToggle: (value: string) => void
  }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && isOpen) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
      }
    }, [isOpen])

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between rounded border bg-background px-3 text-sm hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="truncate">{selected.length === 0 ? `All ${label}` : `${selected.length} selected`}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div
              className="absolute left-0 top-full z-20 mt-1 max-h-60 w-full min-w-[200px] overflow-auto rounded border bg-popover shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {options.map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => onToggle(option)}
                    className="h-4 w-4"
                  />
                  <span className="truncate">{option}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  function MinMaxInput({
    label,
    min,
    max,
    onMinChange,
    onMaxChange,
  }: {
    label: string
    min: string
    max: string
    onMinChange: (value: string) => void
    onMaxChange: (value: string) => void
  }) {
    return (
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          className="h-9 w-full min-w-[80px] rounded border bg-background px-3 text-sm"
        />
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          className="h-9 w-full min-w-[80px] rounded border bg-background px-3 text-sm"
        />
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-[500px] bg-background shadow-2xl overflow-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
            <button type="button" onClick={handleClose} className="rounded-md p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {/* Dropdown Filters */}
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm font-medium">Type</div>
              <MultiSelectDropdown
                label="Type"
                options={availableTypes}
                selected={pendingFilters.type}
                onToggle={(value) => toggleDropdownFilter("type", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Carat Range</div>
              <MultiSelectDropdown
                label="Carat"
                options={availableCaratRanges}
                selected={pendingFilters.caratRange}
                onToggle={(value) => toggleDropdownFilter("caratRange", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Style No</div>
              <MultiSelectDropdown
                label="Style No"
                options={availableCodes}
                selected={pendingFilters.code}
                onToggle={(value) => toggleDropdownFilter("code", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Quality</div>
              <MultiSelectDropdown
                label="Quality"
                options={availableQualities}
                selected={pendingFilters.quality}
                onToggle={(value) => toggleDropdownFilter("quality", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Memo Status</div>
              <MultiSelectDropdown
                label="Status"
                options={["In-House", "On-Memo"]}
                selected={pendingFilters.memoStatus}
                onToggle={(value) => toggleDropdownFilter("memoStatus", value)}
              />
            </div>
          </div>

          {/* Numeric Filters */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <div className="mb-2 text-sm font-medium">Inv. Count</div>
              <MinMaxInput
                label="Inv. Count"
                min={pendingFilters.inventoryCount.min}
                max={pendingFilters.inventoryCount.max}
                onMinChange={(value) => updateMinMaxFilter("inventoryCount", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("inventoryCount", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Inv. Value</div>
              <MinMaxInput
                label="Inv. Value"
                min={pendingFilters.inventoryValue.min}
                max={pendingFilters.inventoryValue.max}
                onMinChange={(value) => updateMinMaxFilter("inventoryValue", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("inventoryValue", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Sales Count</div>
              <MinMaxInput
                label="Sales Count"
                min={pendingFilters.salesCount.min}
                max={pendingFilters.salesCount.max}
                onMinChange={(value) => updateMinMaxFilter("salesCount", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("salesCount", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Sales Value</div>
              <MinMaxInput
                label="Sales Value"
                min={pendingFilters.salesValue.min}
                max={pendingFilters.salesValue.max}
                onMinChange={(value) => updateMinMaxFilter("salesValue", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("salesValue", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Jobs Count</div>
              <MinMaxInput
                label="Jobs Count"
                min={pendingFilters.jobsCount.min}
                max={pendingFilters.jobsCount.max}
                onMinChange={(value) => updateMinMaxFilter("jobsCount", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("jobsCount", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Turn</div>
              <MinMaxInput
                label="Turn"
                min={pendingFilters.turn.min}
                max={pendingFilters.turn.max}
                onMinChange={(value) => updateMinMaxFilter("turn", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("turn", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Needs/Surplus</div>
              <MinMaxInput
                label="Needs/Surplus"
                min={pendingFilters.needs.min}
                max={pendingFilters.needs.max}
                onMinChange={(value) => updateMinMaxFilter("needs", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("needs", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Inv. Aging</div>
              <MinMaxInput
                label="Inv. Aging"
                min={pendingFilters.invAging.min}
                max={pendingFilters.invAging.max}
                onMinChange={(value) => updateMinMaxFilter("invAging", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("invAging", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Sales Aging</div>
              <MinMaxInput
                label="Sales Aging"
                min={pendingFilters.salesAging.min}
                max={pendingFilters.salesAging.max}
                onMinChange={(value) => updateMinMaxFilter("salesAging", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("salesAging", "max", value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium">Days On Memo</div>
              <MinMaxInput
                label="Days On Memo"
                min={pendingFilters.daysOnMemo.min}
                max={pendingFilters.daysOnMemo.max}
                onMinChange={(value) => updateMinMaxFilter("daysOnMemo", "min", value)}
                onMaxChange={(value) => updateMinMaxFilter("daysOnMemo", "max", value)}
              />
            </div>
          </div>

          <div className="sticky bottom-0 border-t bg-background pt-4">
            <Button onClick={applyFilters} className="w-full" size="lg">
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
