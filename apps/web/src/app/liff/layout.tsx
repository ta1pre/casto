'use client'

import React, { useEffect } from 'react'
import Script from 'next/script'
import { LiffLayout as LiffLayoutWrapper } from './_components/LiffLayout'

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
          const hasLiff = typeof window !== 'undefined' && Boolean((window as Window & { liff?: unknown }).liff)
          console.log('[LIFF Layout] SDK script loaded, window.liff present:', hasLiff)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('liff-script-status', {
                detail: {
                  source: 'layout',
                  status: 'load',
                  hasLiff,
                  timestamp: new Date().toISOString(),
                  message: `Script loaded, liff present: ${hasLiff}`
                }
              })
            )
          }
        }}
        onError={(event) => {
          console.error('[LIFF Layout] Failed to load LIFF SDK', event)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('liff-script-status', {
                detail: {
                  source: 'layout',
                  status: 'error',
                  message: String(event),
                  timestamp: new Date().toISOString()
                }
              })
            )
          }
        }}
      />
      <LiffLayoutWrapper>
        {children}
      </LiffLayoutWrapper>
    </>
  )
}
