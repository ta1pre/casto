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
  debugLogs: string[]
  diagnostics: Record<string, unknown>
  reinitializeLiff: () => Promise<void>
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
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown>>({})
  const isRefreshingRef = useRef<boolean>(false)

  const appendLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString()
    setDebugLogs((prev) => [...prev.slice(-49), `[${timestamp}] ${message}`])
  }, [])

  const updateDiagnostics = useCallback((values: Record<string, unknown>) => {
    setDiagnostics((prev) => ({ ...prev, ...values }))
  }, [])

  // LINE認証の実行 [REH]
  const synchronizeLineSession = useCallback(async (isRetry = false) => {
    // 同時実行防止 [REH]
    if (isRefreshingRef.current) {
      console.log('[useLiffAuth] Skipping synchronization (refresh in progress)')
      appendLog('Skip synchronizeLineSession (refresh in progress)')
      return
    }

    if (!window.liff) {
      console.error('[useLiffAuth] window.liff is not defined')
      setError('LIFF SDKが読み込まれていません')
      appendLog('window.liff is not defined')
      updateDiagnostics({ lastSyncError: 'window.liff undefined', lastSyncAt: new Date().toISOString() })
      setIsAuthenticating(false)
      return
    }

    console.log('[useLiffAuth] Starting LINE session synchronization...')
    appendLog('Starting LINE session synchronization')
    setIsAuthenticating(true)
    setError(null)

    const timeoutId = setTimeout(() => {
      console.error('[useLiffAuth] Authentication timeout')
      setError('認証処理がタイムアウトしました')
      appendLog('Authentication timeout')
      updateDiagnostics({ lastSyncError: 'timeout', lastSyncAt: new Date().toISOString() })
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
      console.log('[DEBUG] ID Token details:', {
        hasToken: !!idToken,
        tokenLength: idToken?.length,
        tokenPreview: idToken?.substring(0, 50),
        isLoggedIn: window.liff.isLoggedIn()
      })
      
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
      appendLog(`LINE profile fetched: ${profile.userId}`)
      updateDiagnostics({ lastProfileUserId: profile.userId })

      console.log('[useLiffAuth] Calling loginWithLine...')
      appendLog('Calling loginWithLine with current token')
      await loginWithLine(idToken)
      console.log('[useLiffAuth] LINE session synchronized successfully')
      appendLog('LINE session synchronized successfully')
      
      // 認証成功時にフラグをリセット [REH]
      isRefreshingRef.current = false
      setError(null)
      updateDiagnostics({ lastSyncAt: new Date().toISOString(), lastSyncError: null })
    } catch (err) {
      console.error('[useLiffAuth] Failed to synchronize LINE session:', err)
      const apiError = err instanceof ApiError ? err : null
      appendLog(`Failed to synchronize LINE session: ${err instanceof Error ? err.message : String(err)}`)
      updateDiagnostics({
        lastSyncAt: new Date().toISOString(),
        lastSyncError: err instanceof Error ? err.message : 'unknown'
      })
      
      // 401エラー時の自動再認証 [REH][SF]
      // 詳細な理由チェックは不要、401なら必ず再認証
      const is401Error = !isRetry && apiError?.status === 401
      
      if (is401Error) {
        console.warn('[useLiffAuth] 401 Unauthorized detected, triggering re-authentication')
        appendLog('401 error detected - re-login with redirectUri')
        
        // 同時実行防止フラグを立てる [REH]
        if (isRefreshingRef.current) {
          console.log('[useLiffAuth] Re-login already in progress, skipping')
          appendLog('Skip re-login (already in progress)')
          return
        }
        
        isRefreshingRef.current = true
        setError('認証情報を更新しています...')
        updateDiagnostics({ lastAuthErrorAt: new Date().toISOString() })
        
        try {
          // いったん明示ログアウトしてから再ログイン（トークン再取得）[SF]
          window.liff?.logout()
        } catch {}
        
        // LIFF/LINE内ブラウザいずれでも利用可能な login(redirectUri) に統一
        window.liff?.login({ redirectUri: window.location.href })
        return
      }
      
      const errorMessage = apiError
        ? `LINE認証APIが失敗しました (status=${apiError.status})`
        : err instanceof Error
          ? err.message
          : 'LINE認証に失敗しました'
      setError(errorMessage)
      appendLog(`LINE authentication failed: ${errorMessage}`)
      
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
      appendLog('Initializing LIFF SDK')
      
      if (window.liff) {
        console.log('[useLiffAuth] LIFF SDK already loaded')
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
        console.log('[useLiffAuth] LIFF ID:', liffId ? 'configured' : 'missing')
        appendLog(`LIFF SDK already loaded (ID configured: ${liffId ? 'yes' : 'no'})`)

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          appendLog('LIFF ID is missing')
          return
        }

        console.log('[useLiffAuth] Calling liff.init...')
        appendLog('Calling liff.init() (already loaded path)')
        
        // デバッグ: LIFF初期化前の状態を記録
        const preInitUrl = window.location.href
        console.log('[DEBUG] Pre-init URL:', preInitUrl)
        console.log('[DEBUG] Pre-init search params:', window.location.search)
        
        try {
          await window.liff.init({ liffId })
          console.log('[useLiffAuth] liff.init complete')
        } catch (initError) {
          console.error('[useLiffAuth] liff.init failed:', initError)
          appendLog(`liff.init failed: ${initError instanceof Error ? initError.message : String(initError)}`)
          setError('LIFFの初期化に失敗しました。再度起動します...')
          // 初期化に失敗した場合はログインフローで再入場を試みる
          window.liff?.login({ redirectUri: window.location.href })
          return
        }
        
        setIsLiffReady(true)
        appendLog('liff.init complete (already loaded path)')
        updateDiagnostics({ lastInitAt: new Date().toISOString(), liffId })

        const isLoggedIn = window.liff.isLoggedIn()
        const idToken = window.liff.getIDToken?.()
        
        console.log('[DEBUG] After liff.init:', {
          isLoggedIn,
          hasIdToken: !!idToken,
          idTokenLength: idToken?.length,
          idTokenPreview: idToken?.substring(0, 50),
          url: window.location.href,
          searchParams: window.location.search
        })
        
        console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)
        appendLog(`window.liff.isLoggedIn(): ${isLoggedIn}`)

        if (!isLoggedIn) {
          console.log('[useLiffAuth] Not logged in. Triggering liff.login()')
          appendLog('Not logged in – calling liff.login(redirectUri)')
          window.liff.login({ redirectUri: window.location.href })
          return
        }

        console.log('[useLiffAuth] LINE logged in - synchronizing session...')
        appendLog('LINE logged in – synchronizing session')
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
          try {
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
            
            // デバッグ: LIFF初期化前の状態を記録
            const preInitUrl = window.location.href
            console.log('[DEBUG] Pre-init URL:', preInitUrl)
            console.log('[DEBUG] Pre-init search params:', window.location.search)
            
            try {
              await window.liff.init({ liffId })
              console.log('[useLiffAuth] liff.init complete')
            } catch (initError) {
              console.error('[useLiffAuth] liff.init failed:', initError)
              setError('LIFFの初期化に失敗しました。再度起動します...')
              window.liff?.login({ redirectUri: window.location.href })
              return
            }
            
            setIsLiffReady(true)

            const isLoggedIn = window.liff.isLoggedIn()
            const idToken = window.liff.getIDToken?.()
            
            console.log('[DEBUG] After liff.init:', {
              isLoggedIn,
              hasIdToken: !!idToken,
              idTokenLength: idToken?.length,
              idTokenPreview: idToken?.substring(0, 50),
              url: window.location.href,
              searchParams: window.location.search
            })
            
            console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)

            if (!isLoggedIn) {
              console.log('[useLiffAuth] Not logged in. Triggering liff.login()')
              window.liff.login({ redirectUri: window.location.href })
              return
            }

            console.log('[useLiffAuth] LINE logged in - synchronizing session...')
            await synchronizeLineSession()
          } catch (error) {
            console.error('[useLiffAuth] Error in LIFF initialization callback:', error)
            setError('LIFF初期化中にエラーが発生しました')
            appendLog(`LIFF init callback error: ${error instanceof Error ? error.message : String(error)}`)
          }
        }, 100)
      }

      script.onerror = () => {
        console.error('[useLiffAuth] LIFF SDK script failed to load')
        setError('LIFF SDKの読み込みに失敗しました')
        appendLog('LIFF SDK script failed to load')
      }

      document.head.appendChild(script)
    } catch (err) {
      console.error('[useLiffAuth] LIFF initialization failed:', err)
      setError('LIFFの初期化に失敗しました')
      appendLog(`LIFF initialization failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [synchronizeLineSession])

  // 初回マウント時にLIFFを初期化
  useEffect(() => {
    void initializeLiff()
  }, [initializeLiff])

  // プロアクティブなトークンリフレッシュ（30分ごと）[PA][SF]
  useEffect(() => {
    if (!isLiffReady || !user) return

    let isActive = true

    // ページがフォアグラウンドに戻ったときにトークンをリフレッシュ [REH]
    const handleVisibilityChange = async () => {
      const wasInactive = !isActive
      isActive = !document.hidden
      
      // バックグラウンド → フォアグラウンドの遷移時
      if (wasInactive && isActive && window.liff?.isLoggedIn()) {
        console.log('[useLiffAuth] Page became active, refreshing token...')
        try {
          const newToken = window.liff.getIDToken?.()
          if (newToken) {
            await loginWithLine(newToken)
            await refreshSession()
            console.log('[useLiffAuth] Token refreshed on visibility change')
          }
        } catch (err) {
          console.error('[useLiffAuth] Failed to refresh token on visibility change:', err)
        }
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    const REFRESH_INTERVAL = 30 * 60 * 1000 // 30分（IDトークンの有効期限60分の半分）
    console.log('[useLiffAuth] Starting proactive token refresh timer (30min interval)')

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

  const reinitializeLiff = useCallback(async () => {
    appendLog('Manual reinitialization requested')
    updateDiagnostics({ lastManualReinitAt: new Date().toISOString() })
    await initializeLiff()
  }, [initializeLiff, appendLog, updateDiagnostics])

  return {
    user,
    isLoading: authLoading || isAuthenticating || !isLiffReady,
    isLiffReady,
    isAuthenticating,
    liffProfile,
    error,
    logout: handleLogout,
    refreshSession,
    debugLogs,
    diagnostics,
    reinitializeLiff
  }
}
