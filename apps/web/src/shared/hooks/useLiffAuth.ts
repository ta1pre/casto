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

type ScriptLoadState = 'pending' | 'appended' | 'loaded' | 'layout-loaded' | 'layout-error' | 'error'

interface LiffScriptEventDetail {
  source: 'layout'
  status: 'load' | 'error'
  hasLiff?: boolean
  timestamp?: string
  message?: string
}

interface UseLiffAuthReturn {
  user: ReturnType<typeof useAuth>['user']
  isLoading: boolean
  isLiffReady: boolean
  isAuthenticating: boolean
  liffProfile: LiffProfile | null
  error: string | null
  logout: () => Promise<void>
  debugLogs: string[]
  clearDebugLogs: () => void
  diagnostics: {
    envLiffIdConfigured: boolean
    hasWindowLiff: boolean
    readyState: DocumentReadyState | undefined
    scriptLoadState: ScriptLoadState
    lastLiffCheckAt: string | null
    lastLiffCheckReason: string | null
    idTokenSnippet: string | null
    profileFetchedAt: string | null
    liffInitStartedAt: string | null
    liffInitCompletedAt: string | null
    lastLoginAttemptAt: string | null
    lastLoginSuccessAt: string | null
    authUserLoadedAt: string | null
    scriptElementCount: number
    scriptAppendedAt: string | null
    layoutScriptLoadedAt: string | null
    layoutScriptErrorAt: string | null
    layoutScriptHasLiff: boolean | null
  }
  reinitializeLiff: () => Promise<void>
  refreshSession: ReturnType<typeof useAuth>['refreshSession']
}

const getTimestamp = () => new Date().toISOString()
const LIFF_SCRIPT_SRC = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
/**
 * LIFF認証用の共通フック
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
  const [envLiffIdConfigured, setEnvLiffIdConfigured] = useState<boolean>(
    !!(process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID)
  )
  const [hasWindowLiff, setHasWindowLiff] = useState<boolean>(typeof window !== 'undefined' && !!window.liff)
  const [readyState, setReadyState] = useState<DocumentReadyState | undefined>(
    typeof document !== 'undefined' ? document.readyState : undefined
  )
  const initialScriptState: ScriptLoadState =
    typeof document !== 'undefined' && document.querySelector(`script[src="${LIFF_SCRIPT_SRC}"]`)
      ? 'loaded'
      : 'pending'
  const [scriptLoadState, setScriptLoadState] = useState<ScriptLoadState>(initialScriptState)
  const [lastLiffCheckAt, setLastLiffCheckAt] = useState<string | null>(null)
  const [lastLiffCheckReason, setLastLiffCheckReason] = useState<string | null>(null)
  const [idTokenSnippet, setIdTokenSnippet] = useState<string | null>(null)
  const [profileFetchedAt, setProfileFetchedAt] = useState<string | null>(null)
  const [liffInitStartedAt, setLiffInitStartedAt] = useState<string | null>(null)
  const [liffInitCompletedAt, setLiffInitCompletedAt] = useState<string | null>(null)
  const [lastLoginAttemptAt, setLastLoginAttemptAt] = useState<string | null>(null)
  const [lastLoginSuccessAt, setLastLoginSuccessAt] = useState<string | null>(null)
  const [authUserLoadedAt, setAuthUserLoadedAt] = useState<string | null>(null)
  const [scriptElementCount, setScriptElementCount] = useState<number>(() => {
    if (typeof document === 'undefined') {
      return 0
    }
    return document.querySelectorAll(`script[src="${LIFF_SCRIPT_SRC}"]`).length
  })
  const [scriptAppendedAt, setScriptAppendedAt] = useState<string | null>(null)
  const [layoutScriptLoadedAt, setLayoutScriptLoadedAt] = useState<string | null>(null)
  const [layoutScriptErrorAt, setLayoutScriptErrorAt] = useState<string | null>(null)
  const [layoutScriptHasLiff, setLayoutScriptHasLiff] = useState<boolean | null>(null)
  const previousUserIdRef = useRef<string | null>(null)
  const isReloginInProgressRef = useRef<boolean>(false)

  const addLog = useCallback((message: string) => {
    const ts = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-19), `[${ts}] ${message}`])
  }, [])

  const updateScriptMetrics = useCallback(
    (reason: string) => {
      if (typeof document === 'undefined') {
        return
      }
      const scripts = document.querySelectorAll(`script[src="${LIFF_SCRIPT_SRC}"]`)
      setScriptElementCount(scripts.length)
      addLog(`[script] count=${scripts.length} (${reason})`)
    },
    [addLog]
  )

  const updateWindowLiff = useCallback(
    (reason: string) => {
      const present = typeof window !== 'undefined' && !!window.liff
      setHasWindowLiff(present)
      setLastLiffCheckAt(getTimestamp())
      setLastLiffCheckReason(reason)
      if (present) {
        setScriptLoadState('loaded')
      }
      addLog(`[window.liff] ${present ? 'present' : 'absent'} (${reason})`)
      updateScriptMetrics(reason)
      return present
    },
    [addLog, updateScriptMetrics]
  )

  // LINE認証の実行
  const synchronizeLineSession = useCallback(async (isRetry = false) => {
    // リログイン中の場合は処理をスキップ [REH]
    if (isReloginInProgressRef.current) {
      console.log('[useLiffAuth] Skipping synchronization (re-login in progress)')
      addLog('Sync skipped: re-login in progress')
      return
    }

    updateWindowLiff('synchronizeLineSession:start')

    if (!window.liff) {
      console.error('[useLiffAuth] window.liff is not defined')
      setError('LIFF SDKが読み込まれていません')
      addLog('ERROR: window.liff is not defined')
      setIsAuthenticating(false)
      return
    }

    console.log('[useLiffAuth] Starting LINE session synchronization...')
    addLog(`Starting LINE session synchronization (retry=${isRetry})`)
    setIsAuthenticating(true)
    setError(null)

    // タイムアウト処理：10秒以内に完了しない場合はエラーとする
    const timeoutId = setTimeout(() => {
      console.error('[useLiffAuth] Authentication timeout')
      setError('認証処理がタイムアウトしました')
      addLog('ERROR: Authentication timeout')
      setIsAuthenticating(false)
    }, 10000)

    // IDトークンをcatchブロックでも参照できるようにスコープを広げる [REH]
    let idToken: string | null = null

    try {
      // LINEアプリ内かどうかの確認（情報のみ、エラーにはしない）
      const inClient = typeof window.liff.isInClient === 'function' 
        ? window.liff.isInClient() 
        : null

      console.log('[useLiffAuth] Is in LINE client:', inClient)
      addLog(`Is in LINE client: ${inClient}`)

      // IDトークンの取得
      idToken = window.liff.getIDToken?.() ?? null
      console.log('[useLiffAuth] ID Token obtained:', idToken ? 'YES' : 'NO')
      addLog(`ID Token: ${idToken ? 'YES' : 'NO'}`)
      setIdTokenSnippet(idToken ? `${idToken.slice(0, 4)}...${idToken.slice(-4)}` : null)
      
      if (!idToken) {
        console.warn('[useLiffAuth] No ID token, triggering login')
        setError('LINE IDトークンが取得できませんでした')
        addLog('WARNING: No ID token -> calling liff.login()')
        isReloginInProgressRef.current = true
        window.liff.login()
        return
      }

      // プロフィール取得
      console.log('[useLiffAuth] Fetching LINE profile...')
      addLog('Fetching LINE profile')
      const profile = await window.liff.getProfile()
      console.log('[useLiffAuth] LINE profile:', profile)
      setLiffProfile(profile)
      setProfileFetchedAt(getTimestamp())

      // バックエンドで認証
      console.log('[useLiffAuth] Calling loginWithLine...')
      addLog('Calling loginWithLine')
      setLastLoginAttemptAt(getTimestamp())
      await loginWithLine(idToken)
      console.log('[useLiffAuth] LINE session synchronized successfully')
      addLog('LINE session synchronized successfully')
      setLastLoginSuccessAt(getTimestamp())
      
      // 認証成功したらリログインフラグをリセット [REH]
      isReloginInProgressRef.current = false
      
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
        console.warn('[useLiffAuth] ID token expired, attempting silent refresh')
        addLog('ID token expired -> attempting silent refresh')
        
        // まずLIFFのログイン状態を再確認 [SF]
        if (window.liff?.isLoggedIn()) {
          // LIFFはログイン済みなので、新しいトークンを取得してリトライ [REH]
          const freshToken = window.liff.getIDToken?.()
          if (freshToken && freshToken !== idToken) {
            console.log('[useLiffAuth] Got fresh token from LIFF, retrying authentication')
            addLog('Fresh token obtained, retrying...')
            setError('トークンを更新中...')
            // 再帰呼び出しでリトライ（isRetry=trueで無限ループ防止）
            return synchronizeLineSession(true)
          }
        }
        
        // サイレントリフレッシュ失敗 → ユーザーに再ログインを促す
        console.warn('[useLiffAuth] Silent refresh failed, triggering re-login')
        addLog('Silent refresh failed -> calling liff.login()')
        setError('LINEトークンの有効期限が切れました。再認証します...')
        
        // リログイン中フラグを立てる [REH]
        isReloginInProgressRef.current = true
        
        // liff.login()はページをリダイレクトするため、即座に実行
        if (window.liff) {
          console.log('[useLiffAuth] Calling liff.login() to refresh token')
          window.liff.login()
        }
        return
      }
      
      const errorMessage = apiError
        ? `LINE認証APIが失敗しました (status=${apiError.status})`
        : err instanceof Error
          ? err.message
          : 'LINE認証に失敗しました'
      setError(errorMessage)
      const errorDetails = apiError
        ? {
            status: apiError.status,
            statusText: apiError.statusText,
            body: apiError.body,
            url: apiError.url
          }
        : err instanceof Error
          ? { message: err.message, stack: err.stack }
          : { error: String(err) }
      
      addLog(`ERROR: synchronizeLineSession failed: ${JSON.stringify(errorDetails, null, 2)}`)
    } finally {
      clearTimeout(timeoutId)
      setIsAuthenticating(false)
      updateWindowLiff('synchronizeLineSession:finally')
    }
  }, [loginWithLine, updateWindowLiff, addLog])

  // LIFF SDKの初期化
  const initializeLiff = useCallback(async () => {
    try {
      console.log('[useLiffAuth] Initializing LIFF SDK...')
      addLog('Initializing LIFF SDK')
      updateWindowLiff('initializeLiff:start')
      
      // 既にLIFF SDKが読み込まれている場合
      if (window.liff) {
        console.log('[useLiffAuth] LIFF SDK already loaded')
        addLog('LIFF SDK already loaded')
        setScriptLoadState('loaded')
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
        console.log('[useLiffAuth] LIFF ID:', liffId ? 'configured' : 'missing')
        addLog(`LIFF ID: ${liffId ? 'configured' : 'missing'}`)
        addLog(`LIFF ID value: ${liffId || 'undefined'}`)

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          addLog('ERROR: LIFF ID not configured')
          return
        }

        console.log('[useLiffAuth] Calling liff.init...')
        addLog('Calling liff.init')
        setLiffInitStartedAt(getTimestamp())
        await window.liff.init({ liffId })
        console.log('[useLiffAuth] liff.init complete')
        addLog('liff.init complete')
        setLiffInitCompletedAt(getTimestamp())
        setIsLiffReady(true)

        const isLoggedIn = window.liff.isLoggedIn()
        console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)
        console.log('[useLiffAuth] Current user state:', user ? 'has user' : 'no user')
        addLog(`Is logged in: ${isLoggedIn} | User state: ${user ? 'has user' : 'no user'}`)

        if (!isLoggedIn) {
          console.log('[useLiffAuth] Not logged in. Triggering liff.login()')
          addLog('Not logged in -> calling liff.login()')
          isReloginInProgressRef.current = true
          window.liff.login()
          return
        }

        // LINEログイン済みの場合は常にセッション同期を実行
        console.log('[useLiffAuth] LINE logged in - synchronizing session...')
        addLog('LINE logged in -> synchronizing session')
        try {
          await synchronizeLineSession()
        } catch (err) {
          console.error('[useLiffAuth] synchronizeLineSession failed in init:', err)
          addLog(`ERROR: synchronizeLineSession failed in init: ${err instanceof Error ? err.message : String(err)}`)
        }
        return
      }

      // LIFF SDKを動的に読み込み
      console.log('[useLiffAuth] Loading LIFF SDK dynamically...')
      addLog('Loading LIFF SDK dynamically')
      const script = document.createElement('script')
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
      script.async = true
      setScriptLoadState('appended')
      setScriptAppendedAt(getTimestamp())
      updateScriptMetrics('script appended')
      addLog(`Script appended to DOM with src: ${script.src}`)
      
      script.onload = () => {
        console.log('[useLiffAuth] LIFF SDK script loaded')
        addLog('LIFF SDK script loaded')
        setScriptLoadState('loaded')
        updateWindowLiff('dynamicScript:onload')
        setTimeout(async () => {
          if (!window.liff) {
            console.error('[useLiffAuth] window.liff not available after script load')
            setError('LIFF SDKの読み込みに失敗しました')
            addLog('ERROR: window.liff not available after script load')
            return
          }

          const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
          console.log('[useLiffAuth] LIFF ID:', liffId ? 'configured' : 'missing')
          addLog(`LIFF ID: ${liffId ? 'configured' : 'missing'}`)
          addLog(`LIFF ID value: ${liffId || 'undefined'}`)

          if (!liffId) {
            setError('LIFF IDが設定されていません')
            addLog('ERROR: LIFF ID not configured')
            return
          }

          console.log('[useLiffAuth] Calling liff.init...')
          addLog('Calling liff.init')
          setLiffInitStartedAt(getTimestamp())
          await window.liff.init({ liffId })
          console.log('[useLiffAuth] liff.init complete')
          addLog('liff.init complete')
          setLiffInitCompletedAt(getTimestamp())
          setIsLiffReady(true)

          const isLoggedIn = window.liff.isLoggedIn()
          console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)
          console.log('[useLiffAuth] Current user state:', user ? 'has user' : 'no user')
          addLog(`Is logged in: ${isLoggedIn} | User state: ${user ? 'has user' : 'no user'}`)

          if (!isLoggedIn) {
            console.log('[useLiffAuth] Not logged in. Triggering liff.login()')
            addLog('Not logged in -> calling liff.login()')
            isReloginInProgressRef.current = true
            window.liff.login()
            return
          }

          // LINEログイン済みの場合は常にセッション同期を実行
          console.log('[useLiffAuth] LINE logged in - synchronizing session...')
          addLog('LINE logged in -> synchronizing session (dynamic load)')
          try {
            await synchronizeLineSession()
          } catch (err) {
            console.error('[useLiffAuth] synchronizeLineSession failed in dynamic load:', err)
            addLog(`ERROR: synchronizeLineSession failed in dynamic load: ${err instanceof Error ? err.message : String(err)}`)
          }
        }, 100)
      }

      script.onerror = () => {
        console.error('[useLiffAuth] LIFF SDK script failed to load')
        setError('LIFF SDKの読み込みに失敗しました')
        addLog('ERROR: LIFF SDK script failed to load')
        setScriptLoadState('error')
      }

      document.head.appendChild(script)
    } catch (err) {
      console.error('[useLiffAuth] LIFF initialization failed:', err)
      setError('LIFFの初期化に失敗しました')
      addLog(`ERROR: LIFF initialization failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [synchronizeLineSession, updateWindowLiff, addLog, updateScriptMetrics])

  // 初回マウント時にLIFFを初期化
  useEffect(() => {
    addLog('Hook mounted')
    if (typeof document !== 'undefined') {
      addLog(`document.readyState: ${document.readyState}`)
      setReadyState(document.readyState)

      const handleReadyStateChange = () => {
        setReadyState(document.readyState)
        addLog(`document.readyState changed: ${document.readyState}`)
      }

      document.addEventListener('readystatechange', handleReadyStateChange)

      return () => {
        document.removeEventListener('readystatechange', handleReadyStateChange)
      }
    }

    return () => {}
  }, [addLog])

  useEffect(() => {
    updateScriptMetrics('initial effect')
  }, [updateScriptMetrics])

  useEffect(() => {
    setEnvLiffIdConfigured(!!(process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID))
    updateWindowLiff('mount')
    if (typeof window !== 'undefined' && window.liff) {
      setScriptLoadState('loaded')
    }
    void initializeLiff()
  }, [initializeLiff, updateWindowLiff, addLog])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<LiffScriptEventDetail>
      const detail = custom.detail
      if (!detail || detail.source !== 'layout') {
        return
      }

      if (detail.status === 'load') {
        const timestamp = detail.timestamp ?? getTimestamp()
        setLayoutScriptLoadedAt(timestamp)
        setLayoutScriptErrorAt(null)
        setLayoutScriptHasLiff(detail.hasLiff ?? null)
        setScriptLoadState((prev) => (prev === 'error' ? prev : 'layout-loaded'))
        addLog(`[layout] script load event (hasLiff=${detail.hasLiff ? 'yes' : 'no'})`)
        updateScriptMetrics('layout load event')
        addLog(`Layout script load: ${detail.message}`)
      } else if (detail.status === 'error') {
        const timestamp = detail.timestamp ?? getTimestamp()
        setLayoutScriptErrorAt(timestamp)
        setLayoutScriptHasLiff(null)
        setLayoutScriptLoadedAt(null)
        setScriptLoadState('layout-error')
        addLog(`[layout] script error event: ${detail.message ?? 'unknown'}`)
        updateScriptMetrics('layout error event')
        addLog(`Layout script error: ${detail.message}`)
      }
    }

    window.addEventListener('liff-script-status', handler as EventListener)

    return () => {
      window.removeEventListener('liff-script-status', handler as EventListener)
    }
  }, [addLog, updateScriptMetrics])

  useEffect(() => {
    const currentId = user?.id ?? null
    if (previousUserIdRef.current !== currentId) {
      previousUserIdRef.current = currentId
      if (user) {
        setAuthUserLoadedAt(getTimestamp())
        addLog(`Auth user loaded: ${user.id}`)
      } else {
        setAuthUserLoadedAt(null)
        addLog('Auth user cleared')
      }
    }
  }, [user, addLog])

  // プロアクティブなトークンリフレッシュ [PA][SF]
  // LINEトークンの有効期限（1時間）より前に自動でリフレッシュ
  useEffect(() => {
    if (!isLiffReady || !user) return

    let isActive = true

    // アプリが非アクティブな場合はスキップ（バッテリー節約）[PA]
    const handleVisibilityChange = () => {
      isActive = !document.hidden
      addLog(`App visibility changed: ${isActive ? 'active' : 'inactive'}`)
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // 50分ごとにリフレッシュ（60分の期限より前）
    const REFRESH_INTERVAL = 50 * 60 * 1000 // 50分
    console.log('[useLiffAuth] Starting proactive token refresh timer (50min interval)')
    addLog('Proactive token refresh timer started (50min interval)')

    const intervalId = setInterval(async () => {
      if (!isActive) {
        console.log('[useLiffAuth] Skipping proactive refresh (app inactive)')
        addLog('Proactive refresh skipped (app inactive)')
        return
      }

      if (!window.liff?.isLoggedIn()) {
        console.log('[useLiffAuth] Skipping proactive refresh (not logged in)')
        addLog('Proactive refresh skipped (not logged in)')
        return
      }

      console.log('[useLiffAuth] Proactive token refresh triggered')
      addLog('Proactive token refresh triggered')

      try {
        const newToken = window.liff.getIDToken?.()
        if (newToken) {
          await loginWithLine(newToken)
          console.log('[useLiffAuth] Proactive token refresh successful')
          addLog('Proactive token refresh successful ✅')
          // セッションも更新してJWTクッキーを延長 [REH]
          await refreshSession()
          addLog('Session cookie also refreshed ✅')
        } else {
          console.warn('[useLiffAuth] No token available for proactive refresh')
          addLog('Proactive refresh: no token available')
        }
      } catch (err) {
        console.error('[useLiffAuth] Proactive refresh failed:', err)
        addLog(`Proactive refresh failed: ${err instanceof Error ? err.message : String(err)}`)
        // 失敗しても既存のエラーハンドリング（Phase 1）が動作するため問題なし
      }
    }, REFRESH_INTERVAL)

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      clearInterval(intervalId)
      console.log('[useLiffAuth] Proactive token refresh timer stopped')
      addLog('Proactive token refresh timer stopped')
    }
  }, [isLiffReady, user, loginWithLine, addLog])

  const reinitializeLiff = useCallback(async () => {
    addLog('Manual reinitialize requested')
    setIsLiffReady(false)
    setError(null)
    setProfileFetchedAt(null)
    setIdTokenSnippet(null)
    setLiffInitStartedAt(null)
    setLiffInitCompletedAt(null)
    setHasWindowLiff(typeof window !== 'undefined' && !!window.liff)
    setEnvLiffIdConfigured(!!(process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID))
    // リログインフラグもリセット [REH]
    isReloginInProgressRef.current = false
    if (typeof window !== 'undefined' && window.liff) {
      setScriptLoadState('loaded')
    } else {
      setScriptLoadState('pending')
    }
    updateWindowLiff('manual reinitialize')
    await initializeLiff()
  }, [initializeLiff, updateWindowLiff, addLog])

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    try {
      if (window.liff?.isLoggedIn()) {
        window.liff.logout()
      }
      await authLogout()
      setLiffProfile(null)
      setError(null)
      addLog('Logged out')
    } catch (err) {
      console.error('Logout failed:', err)
      setError('ログアウトに失敗しました')
      addLog(`ERROR: Logout failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [authLogout, addLog])

  const clearDebugLogs = useCallback(() => {
    setDebugLogs([])
  }, [])

  return {
    user,
    isLoading: authLoading || isAuthenticating || !isLiffReady,
    isLiffReady,
    isAuthenticating,
    liffProfile,
    error,
    logout: handleLogout,
    debugLogs,
    clearDebugLogs,
    diagnostics: {
      envLiffIdConfigured,
      hasWindowLiff,
      readyState,
      scriptLoadState,
      lastLiffCheckAt,
      lastLiffCheckReason,
      idTokenSnippet,
      profileFetchedAt,
      liffInitStartedAt,
      liffInitCompletedAt,
      lastLoginAttemptAt,
      lastLoginSuccessAt,
      authUserLoadedAt,
      scriptElementCount,
      scriptAppendedAt,
      layoutScriptLoadedAt,
      layoutScriptErrorAt,
      layoutScriptHasLiff
    },
    reinitializeLiff,
    refreshSession
  }
}
