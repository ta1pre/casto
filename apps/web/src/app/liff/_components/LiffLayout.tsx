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
    <div className="flex min-h-screen flex-col bg-background">
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: mainBottomPadding }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
