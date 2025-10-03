"use client"

import React, { useEffect } from "react"
import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"

interface LiffLayoutProps {
  children: React.ReactNode
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const pathname = usePathname()
  
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "casto"
    }
  }, [])
  
  // オーディション詳細ページとプロフィール登録ページではフッターを非表示
  const isAuditionDetailPage = /^\/liff\/auditions\/[^/]+$/.test(pathname)
  const isProfileRegistrationPage = pathname === '/liff/profile/new'
  const showFooter = !isAuditionDetailPage && !isProfileRegistrationPage
  
  return (
    <div className="min-h-screen bg-background">
      <main className={showFooter ? "pb-20" : ""}>
        {children}
      </main>
      
      {showFooter && <BottomNav />}
    </div>
  )
}
