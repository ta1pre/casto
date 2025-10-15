'use client'

/**
 * 主催者レイアウトラッパー
 * [SF][CA] 認証ガード + 共通ヘッダー
 */

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useOrganizerAuth } from '../_hooks/useOrganizerAuth'
import { OrganizerHeader } from './OrganizerHeader'

interface OrganizerLayoutProps {
  children: ReactNode
}

// 認証不要なパス
const PUBLIC_PATHS = ['/organizer/login', '/organizer/signup', '/organizer/forgot-password', '/organizer/reset-password']

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const pathname = usePathname()
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  const { user, isLoading, logout } = useOrganizerAuth()

  // 認証不要なページはそのまま表示
  if (isPublicPath) {
    return <div className="min-h-screen bg-gray-50">{children}</div>
  }

  // 認証チェック中、または認証されていない場合はローディング表示
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrganizerHeader user={user} onLogout={logout} />
      <main>{children}</main>
    </div>
  )
}
