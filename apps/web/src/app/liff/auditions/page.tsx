'use client'

import React from 'react'
import { Search } from 'lucide-react'

export default function AuditionsPage() {
  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">オーディションを探す</h1>
      </div>

      {/* 検索バー */}
      <div className="relative">
        <input
          type="text"
          placeholder="キーワードで検索..."
          className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {/* オーディションリスト（仮） */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">新人タレント募集</h3>
          <p className="text-sm text-muted-foreground mb-3">
            次世代のスターを探しています。未経験者歓迎！
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">締切: 2025年11月30日</span>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              詳細を見る
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">ドラマ出演者募集</h3>
          <p className="text-sm text-muted-foreground mb-3">
            2026年春ドラマの出演者を募集中。演技経験者優遇。
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">締切: 2025年12月15日</span>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              詳細を見る
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2">CM出演者募集</h3>
          <p className="text-sm text-muted-foreground mb-3">
            大手企業のCM出演者を募集。撮影は2026年1月予定。
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">締切: 2025年11月20日</span>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
              詳細を見る
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
