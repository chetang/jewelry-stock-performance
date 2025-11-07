export interface SavedFilter {
  id: string
  name: string
  filters: any // FilterState type
  emailEnabled: boolean
  emailRecipients: string[]
  createdAt: string
  lastUsed?: string
}

const STORAGE_KEY = "jewelry_saved_filters"

export const savedFiltersService = {
  getAll(): SavedFilter[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  },

  save(filter: Omit<SavedFilter, "id" | "createdAt">): SavedFilter {
    const newFilter: SavedFilter = {
      ...filter,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    const all = this.getAll()
    all.push(newFilter)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    return newFilter
  },

  update(id: string, updates: Partial<SavedFilter>): void {
    const all = this.getAll()
    const index = all.findIndex((f) => f.id === id)
    if (index !== -1) {
      all[index] = { ...all[index], ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    }
  },

  delete(id: string): void {
    const all = this.getAll()
    const filtered = all.filter((f) => f.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  },

  updateLastUsed(id: string): void {
    this.update(id, { lastUsed: new Date().toISOString() })
  },
}
