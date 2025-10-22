const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

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
      console.log("[v0] API Request:", url, config)
      const response = await fetch(url, config)

      const contentType = response.headers.get("content-type")
      const isJson = contentType?.includes("application/json")

      console.log("[v0] API Response:", {
        status: response.status,
        contentType,
        isJson,
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken()
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
        }

        if (!isJson) {
          const text = await response.text()
          console.error("[v0] Non-JSON error response:", text.substring(0, 200))
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
        console.error("[v0] Expected JSON but got:", text.substring(0, 200))
        throw new Error("API returned non-JSON response")
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] API request failed:", error)
      throw error
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ user: { email, password } }),
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

  // Jewelry APIs
  async getLevel1Grid(params: { metric: string; date_from: string; date_to: string; ideal_turn: number }) {
    return this.request<any>(`/jewelry/level1_grid?${new URLSearchParams(params as any)}`)
  }

  async getLevel2Grid(params: {
    metric: string
    date_from: string
    date_to: string
    ideal_turn: number
    category: string
    carat_range: string
  }) {
    return this.request<any>(`/jewelry/level2_grid?${new URLSearchParams(params as any)}`)
  }

  async getLevel3Detail(params: {
    date_from: string
    date_to: string
    ideal_turn: number
    category: string
    carat_range: string
    sub_category: string
    quality: string
  }) {
    return this.request<any>(`/jewelry/level3_detail?${new URLSearchParams(params as any)}`)
  }

  async getTableView(params: { metric: string; date_from: string; date_to: string; ideal_turn: number }) {
    return this.request<any>(`/jewelry/table_view?${new URLSearchParams(params as any)}`)
  }
}

export const apiClient = new ApiClient()
