'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { ApiError } from '@/shared/lib/api'

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>
      isLoggedIn: () => boolean
      login: (config?: { redirectUri?: string }) => void
      logout: () => void
      getIDToken?: () => string | null
      getAccessToken?: () => string | null
      getProfile: () => Promise<LiffProfile>
      isInClient?: () => boolean
    }
  }
}

interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface UseLiffAuthReturn {
  user: ReturnType<typeof useAuth>['user']
  isLoading: boolean
  isLiffReady: boolean
  isAuthenticating: boolean
  liffProfile: LiffProfile | null
  error: string | null
  logout: () => Promise<void>
  refreshSession: ReturnType<typeof useAuth>['refreshSession']
}

const LIFF_SCRIPT_SRC = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
const MINIAPP_FALLBACK_MESSAGE = 'LINEミニアプリはこちらからアクセスしてください'
const TOKEN_EXP_SKEW_MS = 5 * 1000

function isInLineClient(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (typeof window.liff?.isInClient === 'function') {
      return window.liff.isInClient()
    }
  } catch (error) {
    console.warn('[useLiffAuth] Failed to call liff.isInClient()', error)
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
  return ua.includes('line/')
}

function decodeTokenExpiration(token: string): number | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

export function useLiffAuth(): UseLiffAuthReturn {
  const { user, loginWithLine, logout: authLogout, isLoading: authLoading, refreshSession } = useAuth()
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const loginTriggeredRef = useRef(false)

  const handleTokenIssue = useCallback(() => {
    const inClient = isInLineClient()
    if (inClient) {
      setError(MINIAPP_FALLBACK_MESSAGE)
      return
    }

    if (loginTriggeredRef.current) {
      setError('LINEログイン処理を完了できませんでした。ページを再読み込みしてください。')
      return
    }

    loginTriggeredRef.current = true
    try {
      window.liff?.logout()
    } catch (logoutError) {
      console.warn('[useLiffAuth] Failed to logout before re-login', logoutError)
    }
    
    /**
     * redirectパラメータを保持してliff.login()を呼び出す [SF][REH]
     * 
     * 通知リンクから開かれた場合（例: ?redirect=/auditions/123）、
     * 再認証後も同じredirectパラメータを維持することで、
     * 認証完了後に正しいページへ遷移できるようにします。
     */
    const currentUrl = new URL(window.location.href)
    const redirectPath = currentUrl.searchParams.get('redirect')
    
    // redirectパラメータがある場合、それを保持したURLをredirectUriに設定
    const redirectUri = redirectPath 
      ? `${currentUrl.origin}${currentUrl.pathname}?redirect=${encodeURIComponent(redirectPath)}`
      : window.location.href
    
    console.log('[useLiffAuth] Calling liff.login() with redirectUri:', redirectUri)
    window.liff?.login({ redirectUri })
  }, [])

  const synchronizeLineSession = useCallback(async () => {
    if (!window.liff) {
      setError('LIFF SDKが読み込まれていません')
      return
    }

    setIsAuthenticating(true)
    try {
      setError(null)
      const rawToken = window.liff.getIDToken?.() ?? null
      const expiration = rawToken ? decodeTokenExpiration(rawToken) : null
      const expired = expiration !== null && expiration <= Date.now() + TOKEN_EXP_SKEW_MS

      if (!rawToken || expired) {
        handleTokenIssue()
        return
      }

      const profile = await window.liff.getProfile()
      setLiffProfile(profile)

      await loginWithLine(rawToken)
      setError(null)
      loginTriggeredRef.current = false
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      if (apiError?.status === 401) {
        handleTokenIssue()
        return
      }

      console.error('[useLiffAuth] Failed to synchronize LINE session:', err)
      const message =
        apiError != null
          ? `LINE認証APIが失敗しました (status=${apiError.status})`
          : err instanceof Error
            ? err.message
            : 'LINE認証に失敗しました'
      setError(message)
    } finally {
      setIsAuthenticating(false)
    }
  }, [handleTokenIssue, loginWithLine])

  const initializeLiff = useCallback(async () => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
    if (!liffId) {
      setError('LIFF IDが設定されていません')
      return
    }

    const run = async () => {
      if (!window.liff) {
        setError('LIFF SDKが読み込まれていません')
        return
      }

      try {
        await window.liff.init({ liffId })
      } catch (err) {
        console.error('[useLiffAuth] liff.init failed:', err)
        setError('LIFFの初期化に失敗しました')
        return
      }

      setIsLiffReady(true)

      if (!window.liff.isLoggedIn()) {
        handleTokenIssue()
        return
      }

      await synchronizeLineSession()
    }

    if (window.liff) {
      await run()
      return
    }

    const script = document.createElement('script')
    script.src = LIFF_SCRIPT_SRC
    script.async = true
    script.onload = () => {
      void run()
    }
    script.onerror = () => {
      console.error('[useLiffAuth] LIFF SDK script failed to load')
      setError('LIFF SDKの読み込みに失敗しました')
    }
    document.head.appendChild(script)
  }, [handleTokenIssue, synchronizeLineSession])

  useEffect(() => {
    void initializeLiff()
  }, [initializeLiff])

  const handleLogout = useCallback(async () => {
    try {
      if (window.liff?.isLoggedIn()) {
        window.liff.logout()
      }
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      await authLogout()
      setLiffProfile(null)
      setError(null)
      loginTriggeredRef.current = false
    }
  }, [authLogout])

  return {
    user,
    isLoading: authLoading || isAuthenticating || !isLiffReady,
    isLiffReady,
    isAuthenticating,
    liffProfile,
    error,
    logout: handleLogout,
    refreshSession
  }
}
