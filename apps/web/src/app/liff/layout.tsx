'use client'

import React, { useEffect } from 'react'
import Script from 'next/script'
import { LiffLayout as LiffLayoutWrapper } from './_components/LiffLayout'

/**
 * LIFF Root Layout [SF]
 * LIFF SDK の読み込みと基本構造を提供
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
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[LIFF Layout] SDK script loaded')
        }}
        onError={(event) => {
          console.error('[LIFF Layout] Failed to load LIFF SDK', event)
        }}
      />
      <LiffLayoutWrapper>
        {children}
      </LiffLayoutWrapper>
    </>
  )
}
