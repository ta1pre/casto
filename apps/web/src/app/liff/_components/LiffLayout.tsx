"use client"

import React, { useEffect } from "react"
import { BottomNav, BOTTOM_NAV_HEIGHT } from "./BottomNav"
import { useLiffAuth } from "@/shared/hooks/useLiffAuth"

interface LiffLayoutProps {
  children: React.ReactNode
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const { isAuthenticating, error, isLiffReady } = useLiffAuth()

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "casto"
    }
  }, [])

  const mainBottomPadding = `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 24px)`

  // 認証処理中、またはLIFF初期化中はローディング画面を表示 [SF]
  if (isAuthenticating || !isLiffReady) {
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

  // エラー時も何も表示しない（liff.login()でリダイレクトされる）
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-lg font-medium">認証中...</div>
          <div className="text-sm text-muted-foreground">
            LINEログイン画面へ移動しています
          </div>
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
