import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')

interface SessionUser {
  id: string
  role?: string | null
  provider?: 'line' | 'email' | null
}

interface RouteRule {
  pattern: RegExp
  requiredProvider?: 'line' | 'email'
  requiredRoles?: string[]
  allowPublic?: boolean
  redirectTo?: string
}

const ROUTE_RULES: RouteRule[] = [
  {
    pattern: /^\/liff(\/|$)/,
    requiredProvider: 'line',
    allowPublic: true,
    redirectTo: '/login'
  },
  {
    pattern: /^\/organizer(\/|$)/,
    requiredProvider: 'email',
    requiredRoles: ['organizer', 'manager', 'admin'],
    redirectTo: '/login'
  },
  {
    pattern: /^\/admin(\/|$)/,
    requiredProvider: 'email',
    requiredRoles: ['admin'],
    redirectTo: '/login'
  }
]

const SESSION_CACHE = new Map<string, { timestamp: number; user: SessionUser | null }>()
const SESSION_CACHE_TTL = 5 * 1000

interface SessionResponse {
  user: SessionUser | null
}

async function fetchSession(request: NextRequest): Promise<SessionUser | null> {
  if (!API_BASE_URL) {
    return null
  }

  const cookie = request.headers.get('cookie') ?? ''
  if (!cookie.includes('casto_auth=')) {
    return null
  }

  const cacheKey = cookie
  const now = Date.now()
  const cached = SESSION_CACHE.get(cacheKey)
  if (cached && now - cached.timestamp < SESSION_CACHE_TTL) {
    return cached.user
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/session`, {
      method: 'GET',
      headers: {
        cookie
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      SESSION_CACHE.set(cacheKey, { timestamp: now, user: null })
      return null
    }

    const data = (await response.json()) as SessionResponse
    SESSION_CACHE.set(cacheKey, { timestamp: now, user: data.user })
    return data.user
  } catch (error) {
    console.warn('Failed to fetch session in middleware:', error)
    return null
  }
}

function matchRule(pathname: string) {
  return ROUTE_RULES.find((rule) => rule.pattern.test(pathname))
}

function lacksRole(user: SessionUser | null, rule: RouteRule) {
  if (!rule.requiredRoles || !user?.role) {
    return false
  }
  return !rule.requiredRoles.includes(user.role)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rule = matchRule(pathname)

  if (!rule) {
    return NextResponse.next()
  }

  const sessionUser = await fetchSession(request)

  if (!sessionUser) {
    if (rule.allowPublic) {
      return NextResponse.next()
    }

    if (rule.redirectTo) {
      const url = new URL(rule.redirectTo, request.url)
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (rule.requiredProvider && sessionUser.provider !== rule.requiredProvider) {
    if (rule.redirectTo) {
      const url = new URL(rule.redirectTo, request.url)
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (lacksRole(sessionUser, rule)) {
    if (rule.redirectTo) {
      const url = new URL(rule.redirectTo, request.url)
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/liff/:path*', '/organizer/:path*', '/admin/:path*']
}
