'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>
      isLoggedIn: () => boolean
      login: () => void
      logout: () => void
      getProfile: () => Promise<{
        userId: string
        displayName: string
        pictureUrl?: string
        statusMessage?: string
      }>
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
  const { user, login, logout, isLoading } = useAuth()
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null)
  const [isLiffInitialized, setIsLiffInitialized] = useState(false)

  useEffect(() => {
    initializeLiff()
  }, [])

  const initializeLiff = async () => {
    try {
      // LIFF SDKが既に読み込まれているかチェック
      if (!window.liff) {
        // LIFF SDKをCDNから読み込み
        const script = document.createElement('script')
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
        script.onload = async () => {
          // スクリプトが読み込まれたら、グローバルにliffが利用可能になる
          setTimeout(() => {
            initializeLiffAfterLoad()
          }, 100)
        }
        document.head.appendChild(script)
      } else {
        await initializeLiffAfterLoad()
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error)
    }
  }

  const initializeLiffAfterLoad = async () => {
    try {
      if (!window.liff) {
        console.error('LIFF SDK is not loaded')
        return
      }

      // LIFF IDは環境変数から取得
      const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
      if (!liffId) {
        console.error('LIFF ID is not set. Please set NEXT_PUBLIC_LINE_LIFF_ID or NEXT_PUBLIC_LIFF_ID')
        return
      }

      await window.liff.init({ liffId })
      setIsLiffInitialized(true)

      if (window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile()
        setLiffProfile(profile)

        // 認証プロバイダーにログイン
        login({
          id: profile.userId,
          name: profile.displayName,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage,
          provider: 'line',
          role: 'applicant'
        })
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error)
    }
  }

  const handleLogin = async () => {
    try {
      if (!window.liff) {
        console.error('LIFF SDK is not loaded')
        return
      }
      if (!window.liff.isLoggedIn()) {
        window.liff.login()
      }
    } catch (error) {
      console.error('Login failed:', error)
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
      logout()
      setLiffProfile(null)
    } catch (error) {
      console.error('Logout failed:', error)
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

      {user ? (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>ログイン中</h2>

          {liffProfile?.pictureUrl && (
            <img
              src={liffProfile.pictureUrl}
              alt="Profile"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                marginBottom: '1rem'
              }}
            />
          )}

          <p><strong>ユーザーID:</strong> {user.id}</p>
          <p><strong>表示名:</strong> {user.displayName}</p>
          <p><strong>プロバイダー:</strong> {user.provider}</p>
          <p><strong>ロール:</strong> {user.role}</p>

          {user.statusMessage && (
            <p><strong>ステータスメッセージ:</strong> {user.statusMessage}</p>
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
        </div>
      )}
    </div>
  )
}
