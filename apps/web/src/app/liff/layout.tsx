'use client'

import React, { useEffect, Suspense } from 'react'
import { LiffLayout as LiffLayoutWrapper } from './_components/LiffLayout'
import { AuthProvider } from '@/shared/providers/AuthProvider'

/**
 * LIFF Root Layout [SF][REH]
 * LIFF SDK の読み込みと基本構造を提供
 * AuthProvider: LINE認証が必要な/liff配下のみに適用
 * 
 * Suspenseでラップ: LiffLayoutWrapper内でuseSearchParams()を使用するため、
 * Next.js 15の要件に従いSuspenseバウンダリーが必要
 */
export default function LiffRootLayout({ children }: { children: React.ReactNode }) {
  // Development環境でerudaを起動（LINEアプリ内でコンソールログ確認用）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      import('eruda').then((eruda) => {
        eruda.default.init()
        console.log('[Eruda] Mobile debug console initialized')
      }).catch((err) => {
        console.warn('[Eruda] Failed to load:', err)
      })
    }
  }, [])

  return (
    <>
      {/* LIFF SDK preload（事前読み込みで高速化）[PA] */}
      <link rel="preload" href="https://static.line-scdn.net/liff/edge/2/sdk.js" as="script" />
      
      <AuthProvider>
        <Suspense fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center">
              <div className="mb-4 text-lg font-medium">読み込み中...</div>
              <div className="text-sm text-muted-foreground">
                LINEミニアプリを初期化しています
              </div>
            </div>
          </div>
        }>
          <LiffLayoutWrapper>
            {children}
          </LiffLayoutWrapper>
        </Suspense>
      </AuthProvider>
    </>
  )
}
