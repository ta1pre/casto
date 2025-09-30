'use client'

import React from 'react'
import Script from 'next/script'

export default function LiffLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="beforeInteractive"
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
                  timestamp: new Date().toISOString()
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
      {children}
    </>
  )
}
