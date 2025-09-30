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

  // LINE認証の実行
  const synchronizeLineSession = useCallback(async () => {
    if (!window.liff) {
      console.error('window.liff is not defined')
      setError('LIFF SDKが読み込まれていません')
      return
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      // LINEアプリ内かどうかの確認
      const inClient = typeof window.liff.isInClient === 'function' 
        ? window.liff.isInClient() 
        : null

      if (inClient === false) {
        setError('LINEアプリ内でページを開いてください')
        setIsAuthenticating(false)
        return
      }

      // IDトークンの取得
      const idToken = window.liff.getIDToken?.()
      if (!idToken) {
        setError('LINE IDトークンが取得できませんでした')
        window.liff.login()
        return
      }

      // プロフィール取得
      const profile = await window.liff.getProfile()
      setLiffProfile(profile)

      // バックエンドで認証
      await loginWithLine(idToken)
      
      setError(null)
    } catch (err) {
      console.error('Failed to synchronize LINE session:', err)
      setError('LINE認証に失敗しました。再度お試しください。')
    } finally {
      setIsAuthenticating(false)
    }
  }, [loginWithLine])

  // LIFF SDKの初期化
  const initializeLiff = useCallback(async () => {
    try {
      // 既にLIFF SDKが読み込まれている場合
      if (window.liff) {
        const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          setError('LIFF IDが設定されていません')
          return
        }

        await window.liff.init({ liffId })
        setIsLiffReady(true)

        // ログイン済みの場合は認証を実行
        if (window.liff.isLoggedIn() && !user) {
          await synchronizeLineSession()
        }
        return
      }

      // LIFF SDKを動的に読み込み
      const script = document.createElement('script')
      script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
      script.async = true
      
      script.onload = () => {
        setTimeout(async () => {
          if (!window.liff) {
            setError('LIFF SDKの読み込みに失敗しました')
            return
          }

          const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
          if (!liffId) {
            setError('LIFF IDが設定されていません')
            return
          }

          await window.liff.init({ liffId })
          setIsLiffReady(true)

          // ログイン済みの場合は認証を実行
          if (window.liff.isLoggedIn() && !user) {
            await synchronizeLineSession()
          }
        }, 100)
      }

      script.onerror = () => {
        setError('LIFF SDKの読み込みに失敗しました')
      }

      document.head.appendChild(script)
    } catch (err) {
      console.error('LIFF initialization failed:', err)
      setError('LIFFの初期化に失敗しました')
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
    logout: handleLogout
  }
}
