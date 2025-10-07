"use client"

import React, { useEffect } from "react"
import { BottomNav, BOTTOM_NAV_HEIGHT } from "./BottomNav"
import { useLiffAuth } from "@/shared/hooks/useLiffAuth"

interface LiffLayoutProps {
  children: React.ReactNode
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const { isLoading, error, isLiffReady } = useLiffAuth()

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "casto"
    }
  }, [])

  const mainBottomPadding = `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 24px)`

  // 認証処理中、またはLIFF初期化中はローディング画面を表示 [SF][REH]
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium">読み込み中...</div>
          <div className="text-sm text-muted-foreground">
            LINEミニアプリを初期化しています
          </div>
        </div>
      </div>
    )
  }

  // エラー時: ミニアプリの公式URLを提示してユーザー操作で回復可能に [RP][REH]
  if (error) {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
    const liffUrl = liffId ? `https://miniapp.line.me/${liffId}` : null
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium">LINEミニアプリはこちらから</div>
          {liffUrl ? (
            <div className="space-y-2">
              <a
                href={liffUrl}
                className="text-primary underline break-all"
              >
                {liffUrl}
              </a>
              <div className="text-xs text-muted-foreground">
                エラーが続く場合は上記リンクから開いてください
              </div>
            </div>
          ) : (
            <div className="text-sm text-destructive">
              設定エラー：LIFF IDが見つかりません
            </div>
          )}
        </div>
      </div>
    )
  }

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
