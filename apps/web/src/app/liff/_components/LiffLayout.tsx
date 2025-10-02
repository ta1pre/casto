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
  
  // オーディション詳細ページとプロフィール登録ページではヘッダー・フッターを非表示
  const isAuditionDetailPage = /^\/liff\/auditions\/[^/]+$/.test(pathname)
  const isProfileRegistrationPage = pathname === '/liff/profile/new'
  const showHeader = !isAuditionDetailPage && !isProfileRegistrationPage
  const showFooter = !isAuditionDetailPage && !isProfileRegistrationPage
  
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
