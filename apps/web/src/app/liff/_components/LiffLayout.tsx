"use client"

import React, { useEffect } from "react"
import { BottomNav, BOTTOM_NAV_HEIGHT } from "./BottomNav"

interface LiffLayoutProps {
  children: React.ReactNode
}

export function LiffLayout({ children }: LiffLayoutProps) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "casto"
    }
  }, [])

  const mainBottomPadding = `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 24px)`

  return (
    <div className="min-h-screen bg-background">
      <main style={{ paddingBottom: mainBottomPadding }}>
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
