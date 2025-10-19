'use client'

/**
 * 管理者レイアウト
 * [SF][CA] 認証ガード付きレイアウト
 */

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Navigation } from './_components/Navigation'

// 認証不要なパブリックページ
const PUBLIC_PATHS = [
  '/admin/login',
  '/admin/signup',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  
  // 認証不要なページはサイドバーなし
  if (isPublicPath) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }
  
  // 認証済みページはサイドバー付き
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* サイドバーナビゲーション */}
      <Navigation />
      
      {/* メインコンテンツエリア */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
