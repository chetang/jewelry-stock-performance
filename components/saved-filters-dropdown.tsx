"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, Trash2, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SavedFilter } from "@/lib/saved-filters"

interface SavedFiltersDropdownProps {
  savedFilters: SavedFilter[]
  onLoad: (filter: SavedFilter) => void
  onDelete: (id: string) => void
}

export function SavedFiltersDropdown({ savedFilters, onLoad, onDelete }: SavedFiltersDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [isOpen])

  function handleLoad(filter: SavedFilter) {
    onLoad(filter)
    setIsOpen(false)
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this saved filter?")) {
      onDelete(id)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (savedFilters.length === 0) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="h-9">
        <Clock className="h-4 w-4 mr-2" />
        Saved Filters ({savedFilters.length})
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-1 w-80 rounded border bg-popover shadow-lg">
          <div className="max-h-96 overflow-auto">
            {savedFilters.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No saved filters yet</div>
            ) : (
              <div className="divide-y">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-start justify-between gap-2 p-3 hover:bg-muted cursor-pointer"
                    onClick={() => handleLoad(filter)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{filter.name}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Created {formatDate(filter.createdAt)}</span>
                        {filter.emailEnabled && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </span>
                        )}
                      </div>
                      {filter.lastUsed && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Last used {formatDate(filter.lastUsed)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, filter.id)}
                      className="rounded p-1 hover:bg-destructive/10 text-destructive"
                      aria-label="Delete filter"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
