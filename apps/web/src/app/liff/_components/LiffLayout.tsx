"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { SimpleHeader } from "./SimpleHeader"
import { BottomNav } from "./BottomNav"

interface LiffLayoutProps {
  children: React.ReactNode
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const pathname = usePathname()
  
  // オーディション詳細ページではヘッダー・フッターを非表示
  const isAuditionDetailPage = /^\/liff\/auditions\/[^/]+$/.test(pathname)
  const showHeader = !isAuditionDetailPage
  const showFooter = !isAuditionDetailPage
  
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <SimpleHeader />}
      
      <main className={showFooter ? "pb-20" : ""}>
        {children}
      </main>
      
      {showFooter && <BottomNav />}
    </div>
  )
}
