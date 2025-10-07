import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * LIFF エリアへのアクセス制御（多段ゲート）[SF][REH]
 * - 目的: /liff を直打ちさせない（UIを一切表示しない）
 * - 戦略:
 *   1) LINE 以外の UA は 404
 *   2) 認証済み（casto_auth）または短命ゲート（liff_gate）所持なら許可
 *   3) miniapp 由来（Sec-Fetch-Site: cross-site or ?from=miniapp）は初回のみ許可し、liff_gate を付与
 *   4) それ以外（直打ち/同一サイト）は miniapp へ 302 リダイレクト
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (!pathname.startsWith('/liff')) {
    return NextResponse.next()
  }

  // 1) LINE 以外は 404
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  const isLineApp = ua.includes('line/')
  if (!isLineApp) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // 取得するヘッダー/クッキー/フラグ
  const secFetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase()
  const secFetchMode = (request.headers.get('sec-fetch-mode') || '').toLowerCase()
  const secFetchDest = (request.headers.get('sec-fetch-dest') || '').toLowerCase()
  const referer = request.headers.get('referer') || ''

  const hasSession = Boolean(request.cookies.get('casto_auth'))
  const hasGate = Boolean(request.cookies.get('liff_gate'))
  const fromFlag = searchParams.get('from') === 'miniapp'

  const isMiniappCrossSite =
    secFetchSite === 'cross-site' && secFetchMode === 'navigate' && secFetchDest === 'document'
  const isDirectOrSame = secFetchSite === 'none' || secFetchSite === 'same-origin'
  const isFromMiniappHeuristic = fromFlag || referer.includes('line.me') || referer.includes('liff')

  // 2) 既に許可済みのユーザーは通す
  if (hasSession || hasGate) {
    return NextResponse.next()
  }

  // 3) miniapp 由来の初回アクセスは通し、短命ゲートを付与
  if (isMiniappCrossSite || isFromMiniappHeuristic) {
    const res = NextResponse.next()
    // 5分だけ有効なゲートクッキー
    res.cookies.set('liff_gate', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 300,
      path: '/liff',
    })
    // 最小診断ログ
    console.log('[Middleware][LIFF Gate] allow-initial', {
      secFetchSite,
      secFetchMode,
      secFetchDest,
      referer,
      fromFlag,
    })
    return res
  }

  // 4) LINE UAからの初回アクセスは通す（無限ループ防止）[REH]
  // refererが空 & Sec-Fetch-Site: noneの場合、LINEミニアプリから開かれた可能性
  console.log('[Middleware][LIFF Gate] DEBUG before line-ua check', {
    secFetchSite,
    refererEmpty: !referer,
    isLineApp,
    ua: ua.substring(0, 100),
  })
  
  if (secFetchSite === 'none' && !referer && isLineApp) {
    const res = NextResponse.next()
    res.cookies.set('liff_gate', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 300,
      path: '/liff',
    })
    console.log('[Middleware][LIFF Gate] allow-line-ua-no-referer', {
      secFetchSite,
      secFetchMode,
      secFetchDest,
      ua: ua.substring(0, 100),
    })
    return res
  }

  // 5) 直打ち/同一サイトからの到達は miniapp へ 302
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
  if (!liffId) {
    // LIFF ID 未設定なら静かに 404 とする（UI非表示を優先）
    console.warn('[Middleware][LIFF Gate] LIFF ID missing; returning 404')
    return new NextResponse('Not Found', { status: 404 })
  }
  const liffUrl = `https://miniapp.line.me/${liffId}`
  console.log('[Middleware][LIFF Gate] redirect-to-miniapp', {
    secFetchSite,
    secFetchMode,
    secFetchDest,
    referer,
  })
  return NextResponse.redirect(liffUrl)
}

export const config = {
  matcher: '/liff/:path*',
}
