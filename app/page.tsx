"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { JewelryDashboard } from "@/components/jewelry-dashboard"
import { useAuth } from "@/lib/auth-context"
import { dataService } from "@/lib/data-service"

export default function Page() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!dataService.isMockMode() && !loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

  if (!dataService.isMockMode() && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!dataService.isMockMode() && !isAuthenticated) {
    return null
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <JewelryDashboard />
      </Suspense>
    </main>
  )
}
