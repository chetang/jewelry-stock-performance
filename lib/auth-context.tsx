"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient } from "./api-client"
import { dataService } from "./data-service"

type User = {
  id: number
  email: string
  role: string
  account_id: number
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (dataService.isMockMode()) {
      setLoading(false)
      return
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (token) {
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      setUser(response.user)
    } catch (error) {
      console.error("[v0] Login failed:", error)
      throw error
    }
  }

  const logout = async () => {
    if (!dataService.isMockMode()) {
      try {
        await apiClient.logout()
      } finally {
        setUser(null)
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: dataService.isMockMode() || !!user || !!apiClient["getToken"](),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
