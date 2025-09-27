'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

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

export default function LiffPage() {
  const { user, loginWithLine, logout, refreshSession, isLoading } = useAuth()
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const synchronizeLineSession = useCallback(async () => {
    if (!window.liff) {
      console.error('window.liff is not defined')
      return
    }

    setIsAuthenticating(true)
    try {
      const inClient = typeof window.liff.isInClient === 'function' ? window.liff.isInClient() : null

      if (inClient === false) {
        setErrorMessage('LINEアプリ内でページを開いてください。PCブラウザの場合は下のボタンからLINEログイン画面を開いてください。')
        return
      }

      const idToken = window.liff.getIDToken?.()
      if (!idToken) {
        setErrorMessage('LINE IDトークンが取得できませんでした。ログインし直してください。')
        window.liff.login()
        return
      }

      const profile = await window.liff.getProfile()
      await loginWithLine(idToken)
      setLiffProfile(profile)
      setErrorMessage(null)
    } catch (error) {
      console.error('Failed to synchronize LINE session:', error)
      setErrorMessage('LINE認証に失敗しました。再度お試しください。')
    } finally {
      setIsAuthenticating(false)
    }
  }, [loginWithLine])

  const initializeLiffAfterLoad = useCallback(async () => {
    try {
      if (!window.liff) {
        console.error('LIFF SDK is not loaded')
        return
      }

      const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
      if (!liffId) {
        console.error('LIFF ID is not set. Please set NEXT_PUBLIC_LINE_LIFF_ID or NEXT_PUBLIC_LIFF_ID')
        setErrorMessage('LIFF IDが設定されていません。環境変数を確認してください。')
        return
      }

      await window.liff.init({ liffId })
      setIsLiffInitialized(true)

      const inClient = typeof window.liff.isInClient === 'function' ? window.liff.isInClient() : null
      if (inClient === false) {
        setErrorMessage('PCブラウザからアクセス中です。LINEログインを完了した後、このページを再読み込みしてください。')
      }

      if (window.liff.isLoggedIn()) {
        await synchronizeLineSession()
        try {
          const profile = await window.liff.getProfile()
          setLiffProfile(profile)
        } catch (profileError) {
          console.warn('Failed to load LIFF profile:', profileError)
        }
      } else {
        void refreshSession()
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error)
      setErrorMessage('LIFFの初期化に失敗しました。環境設定を確認してください。')
    }
  }, [refreshSession, synchronizeLineSession])

  const initializeLiff = useCallback(async () => {
    try {
      if (!window.liff) {
        const script = document.createElement('script')
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
        script.onload = () => {
          setTimeout(() => {
            void initializeLiffAfterLoad()
          }, 100)
        }
        document.head.appendChild(script)
      } else {
        await initializeLiffAfterLoad()
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error)
    }
  }, [initializeLiffAfterLoad])

  useEffect(() => {
    void initializeLiff()
  }, [initializeLiff])

  useEffect(() => {
    if (user && !liffProfile) {
      void refreshSession()
    }
  }, [user, liffProfile, refreshSession])

  const handleLogin = async () => {
    try {
      if (!window.liff) {
        console.error('LIFF SDK is not loaded')
        return
      }

      setErrorMessage(null)

      if (!window.liff.isLoggedIn()) {
        window.liff.login()
        return
      }

      await synchronizeLineSession()
    } catch (error) {
      console.error('Login failed:', error)
      setErrorMessage('LINEログインに失敗しました。')
    }
  }

  const handleLogout = async () => {
    try {
      if (!window.liff) {
        console.error('LIFF SDK is not loaded')
        return
      }
      if (window.liff.isLoggedIn()) {
        window.liff.logout()
      }
      await logout()
      setLiffProfile(null)
      setErrorMessage(null)
    } catch (error) {
      console.error('Logout failed:', error)
      setErrorMessage('ログアウトに失敗しました。')
    }
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        読み込み中...
      </div>
    )
  }

  if (!isLiffInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        LIFFを初期化中...
      </div>
    )
  }

  if (isAuthenticating) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        LINE認証中...
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        LINE LIFF ページ
      </h1>

      {errorMessage && (
        <div style={{
          border: '1px solid #f44336',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          {errorMessage}
        </div>
      )}

      {user ? (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>ログイン中</h2>

          {liffProfile?.pictureUrl && (
            <Image
              src={liffProfile.pictureUrl}
              alt="Profile"
              width={80}
              height={80}
              style={{
                borderRadius: '50%',
                marginBottom: '1rem'
              }}
            />
          )}

          <p><strong>ユーザーID:</strong> {user.id}</p>
          <p><strong>表示名:</strong> {user.displayName ?? liffProfile?.displayName}</p>
          <p><strong>プロバイダー:</strong> {user.provider}</p>
          <p><strong>ロール:</strong> {user.role}</p>
          <p><strong>トークンバージョン:</strong> {user.tokenVersion ?? 0}</p>

          {liffProfile?.statusMessage && (
            <p><strong>ステータスメッセージ:</strong> {liffProfile.statusMessage}</p>
          )}

          <button
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc004e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            ログアウト
          </button>
        </div>
      ) : (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>LINEログインが必要です</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            このページをご利用いただくには、LINEログインが必要です。
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <button
              onClick={handleLogin}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#00c300',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              LINEでログイン
            </button>
            <button
              onClick={() => void refreshSession()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              セッション再同期
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
