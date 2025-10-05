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
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/liff/:path*',
}
