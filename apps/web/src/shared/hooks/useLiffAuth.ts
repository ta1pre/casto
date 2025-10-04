'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'
import { ApiError } from '@/shared/lib/api'

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>
      isLoggedIn: () => boolean
      login: () => void
      logout: () => void
      getIDToken?: () => string | null
      getProfile: () => Promise<{
        userId: string
        displayName: string
        pictureUrl?: string
        statusMessage?: string
      }>
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

/**
 * LIFF認証用の共通フック [SF]
 * - LIFF SDKの自動読み込み・初期化
 * - LINE認証の自動実行
 * - 認証状態の管理
 */
export function useLiffAuth(): UseLiffAuthReturn {
  const { user, loginWithLine, logout: authLogout, isLoading: authLoading, refreshSession } = useAuth()
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isRefreshingRef = useRef<boolean>(false)

  // LINE認証の実行 [REH]
  const synchronizeLineSession = useCallback(async (isRetry = false) => {
    // 同時実行防止 [REH]
    if (isRefreshingRef.current) {
      console.log('[useLiffAuth] Skipping synchronization (refresh in progress)')
      return
    }

    if (!window.liff) {
      console.error('[useLiffAuth] window.liff is not defined')
      setError('LIFF SDKが読み込まれていません')
      setIsAuthenticating(false)
      return
    }

    console.log('[useLiffAuth] Starting LINE session synchronization...')
    setIsAuthenticating(true)
    setError(null)

    const timeoutId = setTimeout(() => {
      console.error('[useLiffAuth] Authentication timeout')
      setError('認証処理がタイムアウトしました')
      setIsAuthenticating(false)
    }, 10000)

    let idToken: string | null = null

    try {
      const inClient = typeof window.liff.isInClient === 'function' 
        ? window.liff.isInClient() 
        : null

      console.log('[useLiffAuth] Is in LINE client:', inClient)

      idToken = window.liff.getIDToken?.() ?? null
      console.log('[useLiffAuth] ID Token obtained:', idToken ? 'YES' : 'NO')
      
      if (!idToken) {
        console.warn('[useLiffAuth] No ID token, triggering login')
        setError('LINE IDトークンが取得できませんでした')
        window.liff.login()
        return
      }

      console.log('[useLiffAuth] Fetching LINE profile...')
      const profile = await window.liff.getProfile()
      console.log('[useLiffAuth] LINE profile:', profile)
      setLiffProfile(profile)

      console.log('[useLiffAuth] Calling loginWithLine...')
      await loginWithLine(idToken)
      console.log('[useLiffAuth] LINE session synchronized successfully')
      
      // 認証成功時にフラグをリセット [REH]
      isRefreshingRef.current = false
      setError(null)
    } catch (err) {
      console.error('[useLiffAuth] Failed to synchronize LINE session:', err)
      const apiError = err instanceof ApiError ? err : null
      
      // トークン期限切れエラーの自動リトライ [REH][SF]
      const isTokenExpiredError = 
        !isRetry &&
        apiError?.status === 401 &&
        apiError.body &&
        typeof apiError.body === 'object' &&
        'details' in apiError.body &&
        typeof apiError.body.details === 'string' &&
        (apiError.body.details.includes('IdToken expired') || 
         apiError.body.details.includes('expired'))
      
      if (isTokenExpiredError) {
        console.warn('[useLiffAuth] ID token expired, attempting silent refresh via liff.init()')
        
        // 同時実行防止フラグを立てる [REH]
        if (isRefreshingRef.current) {
          console.log('[useLiffAuth] Token refresh already in progress, skipping')
          return
        }
        
        isRefreshingRef.current = true
        setError('トークンを更新中...')
        
        try {
          // liff.init()を再実行してトークンをリフレッシュ [SF]
          // これによりログアウトせずに新しいトークンを取得できる
          const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
          if (window.liff && liffId) {
            console.log('[useLiffAuth] Re-initializing LIFF to refresh token...')
            await window.liff.init({ liffId })
            
            // 新しいトークンを取得
            const freshToken = window.liff.getIDToken?.()
            if (freshToken && freshToken !== idToken) {
              console.log('[useLiffAuth] Got fresh token after re-init, retrying authentication')
              isRefreshingRef.current = false
              return synchronizeLineSession(true)
            } else {
              console.warn('[useLiffAuth] Re-init did not provide a fresh token')
              setError('トークンの更新に失敗しました。ページを再読み込みしてください。')
            }
          }
        } catch (reinitError) {
          console.error('[useLiffAuth] Failed to re-initialize LIFF:', reinitError)
          setError('トークンの更新に失敗しました。ページを再読み込みしてください。')
        } finally {
          isRefreshingRef.current = false
        }
        return
      }
      
      const errorMessage = apiError
        ? `LINE認証APIが失敗しました (status=${apiError.status})`
        : err instanceof Error
          ? err.message
          : 'LINE認証に失敗しました'
      setError(errorMessage)
      
      console.error('[useLiffAuth] Error details:', {
        status: apiError?.status,
        body: apiError?.body,
        message: err instanceof Error ? err.message : String(err)
      })
    } finally {
      clearTimeout(timeoutId)
      setIsAuthenticating(false)
    }
  }, [loginWithLine])

  // LIFF SDKの初期化 [SF]
  const initializeLiff = useCallback(async () => {
    try {
      console.log('[useLiffAuth] Initializing LIFF SDK...')
      
      if (window.liff) {
        console.log('[useLiffAuth] LIFF SDK already loaded')
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
        console.log('[useLiffAuth] LIFF ID:', liffId ? 'configured' : 'missing')

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          return
        }

        console.log('[useLiffAuth] Calling liff.init...')
        await window.liff.init({ liffId })
        console.log('[useLiffAuth] liff.init complete')
        setIsLiffReady(true)

        const isLoggedIn = window.liff.isLoggedIn()
        console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)

        if (!isLoggedIn) {
          console.log('[useLiffAuth] Not logged in. Triggering liff.login()')
          window.liff.login()
          return
        }

        console.log('[useLiffAuth] LINE logged in - synchronizing session...')
        await synchronizeLineSession()
        return
      }

      // LIFF SDKを動的に読み込み
      console.log('[useLiffAuth] Loading LIFF SDK dynamically...')
      const script = document.createElement('script')
      script.src = LIFF_SCRIPT_SRC
      script.async = true
      
      script.onload = () => {
        console.log('[useLiffAuth] LIFF SDK script loaded')
        setTimeout(async () => {
          if (!window.liff) {
            console.error('[useLiffAuth] window.liff not available after script load')
            setError('LIFF SDKの読み込みに失敗しました')
            return
          }

          const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
          console.log('[useLiffAuth] LIFF ID:', liffId ? 'configured' : 'missing')

          if (!liffId) {
            setError('LIFF IDが設定されていません')
            return
          }

          console.log('[useLiffAuth] Calling liff.init...')
          await window.liff.init({ liffId })
          console.log('[useLiffAuth] liff.init complete')
          setIsLiffReady(true)

          const isLoggedIn = window.liff.isLoggedIn()
          console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)

          if (!isLoggedIn) {
            console.log('[useLiffAuth] Not logged in. Triggering liff.login()')
            window.liff.login()
            return
          }

          console.log('[useLiffAuth] LINE logged in - synchronizing session...')
          await synchronizeLineSession()
        }, 100)
      }

      script.onerror = () => {
        console.error('[useLiffAuth] LIFF SDK script failed to load')
        setError('LIFF SDKの読み込みに失敗しました')
      }

      document.head.appendChild(script)
    } catch (err) {
      console.error('[useLiffAuth] LIFF initialization failed:', err)
      setError('LIFFの初期化に失敗しました')
    }
  }, [synchronizeLineSession])

  // 初回マウント時にLIFFを初期化
  useEffect(() => {
    void initializeLiff()
  }, [initializeLiff])

  // プロアクティブなトークンリフレッシュ（50分ごと）[PA][SF]
  useEffect(() => {
    if (!isLiffReady || !user) return

    let isActive = true

    const handleVisibilityChange = () => {
      isActive = !document.hidden
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    const REFRESH_INTERVAL = 50 * 60 * 1000 // 50分
    console.log('[useLiffAuth] Starting proactive token refresh timer (50min interval)')

    const intervalId = setInterval(async () => {
      if (!isActive) {
        console.log('[useLiffAuth] Skipping proactive refresh (app inactive)')
        return
      }

      if (!window.liff?.isLoggedIn()) {
        console.log('[useLiffAuth] Skipping proactive refresh (not logged in)')
        return
      }

      console.log('[useLiffAuth] Proactive token refresh triggered')

      try {
        const newToken = window.liff.getIDToken?.()
        if (newToken) {
          await loginWithLine(newToken)
          console.log('[useLiffAuth] Proactive token refresh successful')
          await refreshSession()
          console.log('[useLiffAuth] Session cookie also refreshed')
        } else {
          console.warn('[useLiffAuth] No token available for proactive refresh')
        }
      } catch (err) {
        console.error('[useLiffAuth] Proactive refresh failed:', err)
      }
    }, REFRESH_INTERVAL)

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      clearInterval(intervalId)
      console.log('[useLiffAuth] Proactive token refresh timer stopped')
    }
  }, [isLiffReady, user, loginWithLine, refreshSession])

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    try {
      if (window.liff?.isLoggedIn()) {
        window.liff.logout()
      }
      await authLogout()
      setLiffProfile(null)
      setError(null)
    } catch (err) {
      console.error('Logout failed:', err)
      setError('ログアウトに失敗しました')
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
