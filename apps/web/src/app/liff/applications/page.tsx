'use client'

import React from 'react'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function ApplicationsPage() {
  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">応募管理</h1>
      </div>

      {/* ステータスタブ */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium whitespace-nowrap">
          すべて
        </button>
        <button className="px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium whitespace-nowrap">
          審査中
        </button>
        <button className="px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium whitespace-nowrap">
          合格
        </button>
        <button className="px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm font-medium whitespace-nowrap">
          不合格
        </button>
      </div>

      {/* 応募リスト */}
      <div className="space-y-4">
        {/* 審査中 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">新人タレント募集</h3>
              <p className="text-xs text-muted-foreground">応募日: 2025年10月1日</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-md">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">審査中</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            書類選考の結果をお待ちください。
          </p>
        </div>

        {/* 合格 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">CM出演者募集</h3>
              <p className="text-xs text-muted-foreground">応募日: 2025年9月25日</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 rounded-md">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs font-medium">合格</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            おめでとうございます！次のステップに進んでください。
          </p>
          <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
            詳細を確認
          </button>
        </div>

        {/* 不合格 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">ドラマ出演者募集</h3>
              <p className="text-xs text-muted-foreground">応募日: 2025年9月20日</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-600 rounded-md">
              <XCircle className="h-3 w-3" />
              <span className="text-xs font-medium">不合格</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            今回は残念ながら選考を通過できませんでした。次回のチャレンジをお待ちしています。
          </p>
        </div>
      </div>

      {/* 空の状態（コメントアウト） */}
      {/* <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">まだ応募がありません</p>
        <p className="text-sm text-muted-foreground">
          オーディションに応募すると、ここに表示されます
        </p>
      </div> */}
    </div>
  )
}
