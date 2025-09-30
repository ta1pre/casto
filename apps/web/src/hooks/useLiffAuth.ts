'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'

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
  debugLogs: string[]
  clearDebugLogs: () => void
}

/**
 * LIFF認証用の共通フック
 * - LIFF SDKの自動読み込み・初期化
 * - LINE認証の自動実行
 * - 認証状態の管理
 */
export function useLiffAuth(): UseLiffAuthReturn {
  const { user, loginWithLine, logout: authLogout, isLoading: authLoading } = useAuth()
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`])
  }, [])

  // LINE認証の実行
  const synchronizeLineSession = useCallback(async () => {
    if (!window.liff) {
      console.error('[useLiffAuth] window.liff is not defined')
      setError('LIFF SDKが読み込まれていません')
      addLog('ERROR: window.liff is not defined')
      setIsAuthenticating(false)
      return
    }

    console.log('[useLiffAuth] Starting LINE session synchronization...')
    addLog('Starting LINE session synchronization')
    setIsAuthenticating(true)
    setError(null)

    // タイムアウト処理：10秒以内に完了しない場合はエラーとする
    const timeoutId = setTimeout(() => {
      console.error('[useLiffAuth] Authentication timeout')
      setError('認証処理がタイムアウトしました')
      addLog('ERROR: Authentication timeout')
      setIsAuthenticating(false)
    }, 10000)

    try {
      // LINEアプリ内かどうかの確認
      const inClient = typeof window.liff.isInClient === 'function' 
        ? window.liff.isInClient() 
        : null

      console.log('[useLiffAuth] Is in LINE client:', inClient)
      addLog(`Is in LINE client: ${inClient}`)

      if (inClient === false) {
        console.warn('[useLiffAuth] Not in LINE client')
        setError('LINEアプリ内でページを開いてください')
        addLog('WARNING: Not in LINE client')
        setIsAuthenticating(false)
        return
      }

      // IDトークンの取得
      const idToken = window.liff.getIDToken?.()
      console.log('[useLiffAuth] ID Token obtained:', idToken ? 'YES' : 'NO')
      addLog(`ID Token: ${idToken ? 'YES' : 'NO'}`)
      
      if (!idToken) {
        console.warn('[useLiffAuth] No ID token, triggering login')
        setError('LINE IDトークンが取得できませんでした')
        addLog('WARNING: No ID token -> calling liff.login()')
        window.liff.login()
        return
      }

      // プロフィール取得
      console.log('[useLiffAuth] Fetching LINE profile...')
      addLog('Fetching LINE profile')
      const profile = await window.liff.getProfile()
      console.log('[useLiffAuth] LINE profile:', profile)
      setLiffProfile(profile)

      // バックエンドで認証
      console.log('[useLiffAuth] Calling loginWithLine...')
      addLog('Calling loginWithLine')
      await loginWithLine(idToken)
      console.log('[useLiffAuth] LINE session synchronized successfully')
      addLog('LINE session synchronized successfully')
      
      setError(null)
    } catch (err) {
      console.error('[useLiffAuth] Failed to synchronize LINE session:', err)
      const errorMessage = err instanceof Error ? err.message : 'LINE認証に失敗しました'
      setError(errorMessage)
      addLog(`ERROR: synchronizeLineSession failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      clearTimeout(timeoutId)
      setIsAuthenticating(false)
    }
  }, [loginWithLine])

  // LIFF SDKの初期化
  const initializeLiff = useCallback(async () => {
    try {
      console.log('[useLiffAuth] Initializing LIFF SDK...')
      addLog('Initializing LIFF SDK')
      
      // 既にLIFF SDKが読み込まれている場合
      if (window.liff) {
        console.log('[useLiffAuth] LIFF SDK already loaded')
        addLog('LIFF SDK already loaded')
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
        console.log('[useLiffAuth] LIFF ID:', liffId ? 'configured' : 'missing')
        addLog(`LIFF ID: ${liffId ? 'configured' : 'missing'}`)
        
        if (!liffId) {
          setError('LIFF IDが設定されていません')
          addLog('ERROR: LIFF ID not configured')
          return
        }

        console.log('[useLiffAuth] Calling liff.init...')
        addLog('Calling liff.init')
        await window.liff.init({ liffId })
        console.log('[useLiffAuth] liff.init complete')
        addLog('liff.init complete')
        setIsLiffReady(true)

        const isLoggedIn = window.liff.isLoggedIn()
        console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)
        console.log('[useLiffAuth] Current user state:', user ? 'has user' : 'no user')
        addLog(`Is logged in: ${isLoggedIn} | User state: ${user ? 'has user' : 'no user'}`)

        // ログイン済みの場合は認証を実行
        if (isLoggedIn && !user) {
          console.log('[useLiffAuth] Triggering synchronizeLineSession...')
          addLog('Triggering synchronizeLineSession (already loaded)')
          try {
            await synchronizeLineSession()
          } catch (err) {
            console.error('[useLiffAuth] synchronizeLineSession failed in init:', err)
            addLog(`ERROR: synchronizeLineSession failed in init: ${err instanceof Error ? err.message : String(err)}`)
          }
        }
        return
      }

      // LIFF SDKを動的に読み込み
      console.log('[useLiffAuth] Loading LIFF SDK dynamically...')
      addLog('Loading LIFF SDK dynamically')
      const script = document.createElement('script')
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
      script.async = true
      
      script.onload = () => {
        console.log('[useLiffAuth] LIFF SDK script loaded')
        addLog('LIFF SDK script loaded')
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
          
          if (!liffId) {
            setError('LIFF IDが設定されていません')
            addLog('ERROR: LIFF ID not configured')
            return
          }

          console.log('[useLiffAuth] Calling liff.init...')
          addLog('Calling liff.init')
          await window.liff.init({ liffId })
          console.log('[useLiffAuth] liff.init complete')
          addLog('liff.init complete')
          setIsLiffReady(true)

          const isLoggedIn = window.liff.isLoggedIn()
          console.log('[useLiffAuth] Is logged in to LINE:', isLoggedIn)
          console.log('[useLiffAuth] Current user state:', user ? 'has user' : 'no user')
          addLog(`Is logged in: ${isLoggedIn} | User state: ${user ? 'has user' : 'no user'}`)

          // ログイン済みの場合は認証を実行
          if (isLoggedIn && !user) {
            console.log('[useLiffAuth] Triggering synchronizeLineSession...')
            addLog('Triggering synchronizeLineSession (dynamic load)')
            try {
              await synchronizeLineSession()
            } catch (err) {
              console.error('[useLiffAuth] synchronizeLineSession failed in dynamic load:', err)
              addLog(`ERROR: synchronizeLineSession failed in dynamic load: ${err instanceof Error ? err.message : String(err)}`)
            }
          }
        }, 100)
      }

      script.onerror = () => {
        console.error('[useLiffAuth] LIFF SDK script failed to load')
        setError('LIFF SDKの読み込みに失敗しました')
        addLog('ERROR: LIFF SDK script failed to load')
      }

      document.head.appendChild(script)
    } catch (err) {
      console.error('[useLiffAuth] LIFF initialization failed:', err)
      setError('LIFFの初期化に失敗しました')
      addLog(`ERROR: LIFF initialization failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [user, synchronizeLineSession])

  // 初回マウント時にLIFFを初期化
  useEffect(() => {
    void initializeLiff()
  }, [initializeLiff])

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
  }, [authLogout])

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
    clearDebugLogs
  }
}
