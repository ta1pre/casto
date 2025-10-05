import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * LIFF エリアへのアクセス制御 Layer 1 [SF][ISA]
 * 通常ブラウザからのアクセスを HTTP レベルで早期遮断
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  if (pathname.startsWith('/liff')) {
    const userAgent = request.headers.get('user-agent') || ''
    
    // LINE アプリ以外は即座に遮断
    const isLineApp = userAgent.toLowerCase().includes('line/')
    if (!isLineApp) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // LIFF経由のアクセスかヘッダーで判別 [REH]
    const isLiffContext = request.headers.get('x-liff-context')
    if (!isLiffContext) {
      // ヘッダーがなければ直接アクセスとみなし、LIFF URLへリダイレクト
      const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID
      if (liffId) {
        const liffUrl = `https://liff.line.me/${liffId}`
        return NextResponse.redirect(liffUrl)
      }
      // LIFF IDがなければフォールバック
      return new NextResponse('Configuration Error', { status: 500 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/liff/:path*',
}
