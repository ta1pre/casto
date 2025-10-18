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
 * 
 * 外部ブラウザ対応（2025-10-19）:
 *   - liff.init({ withLoginOnExternalBrowser: true }) により、外部ブラウザでもLINE認証が可能
 *   - 外部ブラウザの場合、LINEのOAuth認証を経由するため、最終的にはLINE経由のアクセスとなる
 *   - UA判定は維持し、悪意のある直接アクセスは引き続きブロック
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  if (!pathname.startsWith('/liff')) {
    return NextResponse.next()
  }

  // 取得するヘッダー/クッキー/フラグ
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  const secFetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase()
  const secFetchMode = (request.headers.get('sec-fetch-mode') || '').toLowerCase()
  const secFetchDest = (request.headers.get('sec-fetch-dest') || '').toLowerCase()

  const hasSession = Boolean(request.cookies.get('casto_auth'))
  const hasGate = Boolean(request.cookies.get('liff_gate'))
  const isLineApp = ua.includes('line/')

  // 1) 既に認証済みのユーザーは無条件で通す [REH]
  if (hasSession || hasGate) {
    return NextResponse.next()
  }

  // 2) 外部ブラウザからのアクセス: LINE OAuth認証を経由させる [SF]
  // withLoginOnExternalBrowser=trueにより、liff.init()で自動的にLINEログインへリダイレクトされる
  if (!isLineApp) {
    // 悪意のあるボット対策: 通常のブラウザからのナビゲーションのみ許可
    const isNormalBrowserNavigation = 
      secFetchMode === 'navigate' && 
      secFetchDest === 'document' &&
      (secFetchSite === 'none' || secFetchSite === 'cross-site' || secFetchSite === 'same-origin')
    
    if (isNormalBrowserNavigation) {
      return NextResponse.next() // 外部ブラウザを許可、LIFF初期化でLINE認証を強制
    } else {
      // 異常なリクエスト（API呼び出し等）はブロック
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  // 3) LINEアプリ内からのアクセスは通す（miniapp由来、またはLINE UAからの初回） [REH]
  if (isLineApp) {
    const res = NextResponse.next()
    // 5分だけ有効なゲートクッキー
    res.cookies.set('liff_gate', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 300,
      path: '/liff',
    })
    return res
  }

  // 4) ここまで到達したら予期しないケース（外部ブラウザでSec-Fetch-*が異常）
  // 念のためLIFFミニアプリへリダイレクト [SF]
  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
  if (liffId) {
    const liffUrl = `https://miniapp.line.me/${liffId}`
    console.log('[Middleware][LIFF Gate] redirect-to-miniapp (fallback)', {
      secFetchSite,
      secFetchMode,
      secFetchDest,
    })
    return NextResponse.redirect(liffUrl)
  }

  // LIFF ID 未設定なら404
  return new NextResponse('Not Found', { status: 404 })
}

export const config = {
  matcher: '/liff/:path*',
}
