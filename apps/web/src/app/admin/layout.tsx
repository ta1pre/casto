/**
 * 管理者レイアウト
 * [SF][CA] 認証ガード付きレイアウト
 */

import { ReactNode } from 'react'
import { Navigation } from './_components/Navigation'

export default function AdminLayout({ children }: { children: ReactNode }) {
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
