/**
 * Next.js Middleware
 * 条件付き認証とパフォーマンス最適化
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 公開ページ（認証不要）
const PUBLIC_PAGES = [
  '/',
  '/login',
  '/register',
  '/about',
  '/terms',
  '/privacy',
  '/api/auth/login',
  '/api/auth/register'
]

// 管理者専用ページ
const ADMIN_PAGES = [
  '/admin',
  '/api/admin',
  '/api/rbac'
]

// 認証必須ページ
const PROTECTED_PAGES = [
  '/dashboard',
  '/profile',
  '/auditions',
  '/entries'
]

/**
 * 認証状態をチェック
 */
async function checkAuth(request: NextRequest): Promise<{ isAuthenticated: boolean; user?: any }> {
  try {
    // 実際の実装では、セッション確認のAPIを呼び出す
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false }
    }

    // ここで実際のセッション検証を行う
    // 今回は簡易的に実装
    return { isAuthenticated: true }
  } catch (error) {
    console.error('Auth check error:', error)
    return { isAuthenticated: false }
  }
}

/**
 * 権限チェック
 */
function checkPermission(user: any, requiredPermission: string): boolean {
  if (!user || !user.permissions) return false
  return user.permissions.some((p: any) => p.name === requiredPermission)
}

/**
 * ロールチェック
 */
function checkRole(user: any, requiredRole: string): boolean {
  if (!user || !user.roles) return false
  return user.roles.some((r: any) => r.name === requiredRole)
}

/**
 * ページの認証要件を取得
 */
function getPageAuthRequirement(pathname: string) {
  if (PUBLIC_PAGES.includes(pathname)) {
    return { requiresAuth: false, requiredRole: null, requiredPermission: null }
  }

  if (ADMIN_PAGES.some(page => pathname.startsWith(page))) {
    return { requiresAuth: true, requiredRole: 'admin', requiredPermission: null }
  }

  if (PROTECTED_PAGES.some(page => pathname.startsWith(page))) {
    return { requiresAuth: true, requiredRole: null, requiredPermission: null }
  }

  // デフォルトは認証不要
  return { requiresAuth: false, requiredRole: null, requiredPermission: null }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // APIルートは処理しない
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const authRequirement = getPageAuthRequirement(pathname)

  // 公開ページは認証チェックなし
  if (!authRequirement.requiresAuth) {
    return NextResponse.next()
  }

  // 認証チェック
  const authResult = await checkAuth(request)

  if (!authResult.isAuthenticated) {
    // 認証が必要なページで未認証の場合、ログインページにリダイレクト
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 管理者権限チェック
  if (authRequirement.requiredRole && !checkRole(authResult.user, authRequirement.requiredRole)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // 権限チェック
  if (authRequirement.requiredPermission && !checkPermission(authResult.user, authRequirement.requiredPermission)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
