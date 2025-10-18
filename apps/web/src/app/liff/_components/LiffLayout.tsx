"use client"

import React, { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BottomNav, BOTTOM_NAV_HEIGHT } from "./BottomNav"
import { useLiffAuth } from "@/shared/hooks/useLiffAuth"

interface LiffLayoutProps {
  children: React.ReactNode
}

export function LiffLayout({ children }: LiffLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading, error, isLiffReady, user } = useLiffAuth()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "casto"
    }
  }, [])

  /**
   * 認証完了後のリダイレクト処理 [SF][REH]
   * 
   * 通知リンク（例: line://app/{liffId}?redirect=/auditions/123）から開かれた場合、
   * 認証完了後に指定されたページへ自動遷移します。
   * 
   * - 無限ループ防止: hasRedirectedRefで1回のみ実行
   * - 安全性: /liff/ 配下のパスのみ許可
   * - タイミング: 認証完了（user存在）かつLIFF準備完了後
   */
  useEffect(() => {
    // 認証完了前、またはLIFF未準備の場合はスキップ
    if (!user || !isLiffReady || hasRedirectedRef.current) {
      return
    }

    const redirectPath = searchParams.get('redirect')
    if (!redirectPath) {
      return
    }

    // セキュリティ: /liff/ 配下のパスのみ許可（外部URLや他のパスへの遷移を防止）
    if (!redirectPath.startsWith('/')) {
      console.warn('[LiffLayout] Invalid redirect path (must start with /):', redirectPath)
      return
    }

    // 既にリダイレクト済みの場合はスキップ（無限ループ防止）
    hasRedirectedRef.current = true

    console.log('[LiffLayout] Redirecting to:', redirectPath)
    
    // Next.js Router でページ遷移（LIFFコンテキスト内を維持）
    router.push(`/liff${redirectPath}`)
  }, [user, isLiffReady, searchParams, router])

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
