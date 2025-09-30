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
          // 早期にSDKが載るかを確認
          // eslint-disable-next-line no-console
          console.log('[LIFF Layout] SDK script loaded, window.liff:', typeof window !== 'undefined' && !!(window as any).liff)
        }}
        onError={(e) => {
          // eslint-disable-next-line no-console
          console.error('[LIFF Layout] Failed to load LIFF SDK', e)
        }}
      />
      {children}
    </>
  )
}
