const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    const token = this.getToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  }

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }

        if (!isJson) {
          const text = await response.text()
          throw new Error(
            `API Error: The backend returned HTML instead of JSON. This usually means:\n` +
              `1. The API endpoint doesn't exist (404)\n` +
              `2. The backend server is not running\n` +
              `3. The API URL is incorrect\n\n` +
              `Current API URL: ${API_BASE_URL}\n` +
              `Endpoint: ${endpoint}\n` +
              `Status: ${response.status}`,
          )
        }

        const error = await response.json().catch(() => ({ error: "Request failed" }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      if (!isJson) {
        const text = await response.text()
        throw new Error("API returned non-JSON response")
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] API request failed:", error)
      throw error
    }
  }

  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    this.setToken(response.token)
    return response
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "DELETE" })
    } finally {
      this.clearToken()
    }
  }

  async getMe() {
    return this.request<{ user: any }>("/auth/me")
  }

  async getLevel1Grid(params: {
    from_date: string
    to_date: string
    ideal_turn: number
    filter_type?: string[]
    filter_carat_range?: string[]
    filter_code?: string[]
    filter_quality?: string[]
    filter_memo_status?: string[]
    filter_days_on_memo_min?: string
    filter_days_on_memo_max?: string
  }) {
    const searchParams = new URLSearchParams()
    searchParams.append("from_date", params.from_date)
    searchParams.append("to_date", params.to_date)
    searchParams.append("ideal_turn", params.ideal_turn.toString())

    if (params.filter_type) params.filter_type.forEach((v) => searchParams.append("filter_type[]", v))
    if (params.filter_carat_range)
      params.filter_carat_range.forEach((v) => searchParams.append("filter_carat_range[]", v))
    if (params.filter_code) params.filter_code.forEach((v) => searchParams.append("filter_code[]", v))
    if (params.filter_quality) params.filter_quality.forEach((v) => searchParams.append("filter_quality[]", v))
    if (params.filter_memo_status)
      params.filter_memo_status.forEach((v) => searchParams.append("filter_memo_status[]", v))
    if (params.filter_days_on_memo_min) searchParams.append("filter_days_on_memo_min", params.filter_days_on_memo_min)
    if (params.filter_days_on_memo_max) searchParams.append("filter_days_on_memo_max", params.filter_days_on_memo_max)

    return this.request<{ data: any[] }>(`/jewelry/level1?${searchParams}`)
  }

  async getLevel2Grid(params: {
    from_date: string
    to_date: string
    ideal_turn: number
    type: string
    carat_range: string
    filter_type?: string[]
    filter_carat_range?: string[]
    filter_code?: string[]
    filter_quality?: string[]
    filter_memo_status?: string[]
    filter_days_on_memo_min?: string
    filter_days_on_memo_max?: string
  }) {
    const searchParams = new URLSearchParams()
    searchParams.append("from_date", params.from_date)
    searchParams.append("to_date", params.to_date)
    searchParams.append("ideal_turn", params.ideal_turn.toString())
    searchParams.append("type", params.type)
    searchParams.append("carat_range", params.carat_range)

    if (params.filter_type) params.filter_type.forEach((v) => searchParams.append("filter_type[]", v))
    if (params.filter_carat_range)
      params.filter_carat_range.forEach((v) => searchParams.append("filter_carat_range[]", v))
    if (params.filter_code) params.filter_code.forEach((v) => searchParams.append("filter_code[]", v))
    if (params.filter_quality) params.filter_quality.forEach((v) => searchParams.append("filter_quality[]", v))
    if (params.filter_memo_status)
      params.filter_memo_status.forEach((v) => searchParams.append("filter_memo_status[]", v))
    if (params.filter_days_on_memo_min) searchParams.append("filter_days_on_memo_min", params.filter_days_on_memo_min)
    if (params.filter_days_on_memo_max) searchParams.append("filter_days_on_memo_max", params.filter_days_on_memo_max)

    return this.request<{ data: any[] }>(`/jewelry/level2?${searchParams}`)
  }

  async getLevel3Detail(params: {
    from_date: string
    to_date: string
    ideal_turn: number
    type: string
    carat_range: string
    code?: string
    quality?: string
  }) {
    const searchParams = new URLSearchParams()
    searchParams.append("from_date", params.from_date)
    searchParams.append("to_date", params.to_date)
    searchParams.append("ideal_turn", params.ideal_turn.toString())
    searchParams.append("type", params.type)
    searchParams.append("carat_range", params.carat_range)
    if (params.code) searchParams.append("code", params.code)
    if (params.quality) searchParams.append("quality", params.quality)

    return this.request<{ stock: any[]; jobs: any[]; sales: any[]; summary: any }>(`/jewelry/level3?${searchParams}`)
  }

  async getTableView(params: {
    from_date: string
    to_date: string
    ideal_turn: number
    filter_type?: string[]
    filter_carat_range?: string[]
    filter_code?: string[]
    filter_quality?: string[]
    filter_memo_status?: string[]
    filter_days_on_memo_min?: string
    filter_days_on_memo_max?: string
  }) {
    const searchParams = new URLSearchParams()
    searchParams.append("from_date", params.from_date)
    searchParams.append("to_date", params.to_date)
    searchParams.append("ideal_turn", params.ideal_turn.toString())

    if (params.filter_type) params.filter_type.forEach((v) => searchParams.append("filter_type[]", v))
    if (params.filter_carat_range)
      params.filter_carat_range.forEach((v) => searchParams.append("filter_carat_range[]", v))
    if (params.filter_code) params.filter_code.forEach((v) => searchParams.append("filter_code[]", v))
    if (params.filter_quality) params.filter_quality.forEach((v) => searchParams.append("filter_quality[]", v))
    if (params.filter_memo_status)
      params.filter_memo_status.forEach((v) => searchParams.append("filter_memo_status[]", v))
    if (params.filter_days_on_memo_min) searchParams.append("filter_days_on_memo_min", params.filter_days_on_memo_min)
    if (params.filter_days_on_memo_max) searchParams.append("filter_days_on_memo_max", params.filter_days_on_memo_max)

    return this.request<{ data: any[] }>(`/jewelry/table?${searchParams}`)
  }

  async getFilterOptions() {
    return this.request<{ types: string[]; carat_ranges: string[]; codes: string[]; qualities: string[] }>(
      "/jewelry/filter_options",
    )
  }

  async getSavedReports() {
    return this.request<{ data: any[] }>("/saved_reports")
  }

  async createSavedReport(data: { name: string; filters: any; email_enabled: boolean; email_recipients: string[] }) {
    return this.request<{ data: any }>("/saved_reports", {
      method: "POST",
      body: JSON.stringify({ saved_report: data }),
    })
  }

  async updateSavedReport(
    id: number,
    data: { name: string; filters: any; email_enabled: boolean; email_recipients: string[] },
  ) {
    return this.request<{ data: any }>(`/saved_reports/${id}`, {
      method: "PUT",
      body: JSON.stringify({ saved_report: data }),
    })
  }

  async deleteSavedReport(id: number) {
    return this.request<{ message: string }>(`/saved_reports/${id}`, {
      method: "DELETE",
    })
  }

  async useSavedReport(id: number) {
    return this.request<{ data: any }>(`/saved_reports/${id}/use`, {
      method: "POST",
    })
  }

  async getUserPreferences() {
    return this.request<{ data: { ideal_turn: number; from_date: string; to_date: string } }>("/user_preferences")
  }

  async updateUserPreferences(data: { ideal_turn: number; from_date: string; to_date: string }) {
    return this.request<{ data: any }>("/user_preferences", {
      method: "PUT",
      body: JSON.stringify({ user_preference: data }),
    })
  }

  async importCSV(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return fetch(`${API_BASE_URL}/imports/csv`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
      },
      body: formData,
    }).then((res) => res.json())
  }

  getExportURL(type: "table" | "inventory" | "jobs" | "sales", params: any): string {
    const searchParams = new URLSearchParams()
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        if (Array.isArray(params[key])) {
          params[key].forEach((v: string) => searchParams.append(`${key}[]`, v))
        } else {
          searchParams.append(key, params[key].toString())
        }
      }
    })

    const token = this.getToken()
    if (token) {
      searchParams.append("token", token)
    }

    return `${API_BASE_URL}/exports/${type}?${searchParams}`
  }
}

export const apiClient = new ApiClient()
