import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * LIFF エリアへのアクセス制御 [SF][REH]
 * 
 * 戦略:
 *   1) 認証済み（casto_auth or liff_gate）→ 無条件通過
 *   2) 外部ブラウザ → 通常ナビゲーションのみ許可、liff.init()でLINE認証へ
 *   3) LINEアプリ → 通過 + liff_gate付与
 * 
 * 外部ブラウザ対応（2025-10-19）:
 *   - withLoginOnExternalBrowser=true により外部ブラウザでもLINE認証可能
 *   - 悪意のあるボット対策として Sec-Fetch-* ヘッダーチェック
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

  // 3) LINEアプリ内からのアクセスは通す [REH]
  if (isLineApp) {
    const res = NextResponse.next()
    res.cookies.set('liff_gate', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 300,
      path: '/liff',
    })
    return res
  }

  // 4) 予期しないケース（外部ブラウザで異常なリクエスト）
  return new NextResponse('Not Found', { status: 404 })
}

export const config = {
  matcher: '/liff/:path*',
}
