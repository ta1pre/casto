'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { AuthRole } from '@/types/auth'

const ROLES: AuthRole[] = ['organizer', 'manager', 'applicant', 'fan', 'crowdfunding', 'admin']

export default function LoginPage() {
  const {
    user,
    isLoading,
    requestMagicLink,
    verifyMagicLink,
    refreshSession,
    logout
  } = useAuth()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AuthRole>('organizer')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const [issuedToken, setIssuedToken] = useState<string | null>(null)
  const [issuedMagicLinkUrl, setIssuedMagicLinkUrl] = useState<string | undefined>()
  const [verifyToken, setVerifyToken] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setRequestStatus('error')
      setRequestMessage('メールアドレスを入力してください')
      return
    }

    setRequestStatus('loading')
    setRequestMessage(null)
    setIssuedToken(null)
    setIssuedMagicLinkUrl(undefined)

    try {
      const result = await requestMagicLink({ email, role, redirectUrl: redirectUrl || undefined })
      setIssuedToken(result.token)
      setIssuedMagicLinkUrl(result.magicLinkUrl)
      setRequestStatus('success')
      setRequestMessage('Magic Linkトークンを発行しました（メール送信は未実装です）')
      setVerifyToken(result.token)
    } catch (error) {
      console.error('Failed to request magic link:', error)
      setRequestStatus('error')
      setRequestMessage('Magic Linkの発行に失敗しました')
    }
  }

  const handleVerifyMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyToken) {
      setVerifyStatus('error')
      setVerifyMessage('トークンを入力してください')
      return
    }

    setVerifyStatus('loading')
    setVerifyMessage(null)

    try {
      const verifiedUser = await verifyMagicLink(verifyToken)
      setVerifyStatus('success')
      setVerifyMessage(`ログインしました: ${verifiedUser.displayName ?? verifiedUser.email ?? verifiedUser.id}`)
    } catch (error) {
      console.error('Failed to verify magic link:', error)
      setVerifyStatus('error')
      setVerifyMessage('トークンの検証に失敗しました')
    }
  }

  const handleRefreshSession = async () => {
    setSessionMessage('セッションを確認しています...')
    try {
      const refreshed = await refreshSession()
      if (refreshed) {
        setSessionMessage(`セッション更新完了: ${refreshed.displayName ?? refreshed.email ?? refreshed.id}`)
      } else {
        setSessionMessage('セッションは存在しません')
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
      setSessionMessage('セッション取得に失敗しました')
    }
  }

  const handleLogout = async () => {
    setSessionMessage('ログアウトしています...')
    try {
      await logout()
      setSessionMessage('ログアウトしました')
    } catch (error) {
      console.error('Failed to logout:', error)
      setSessionMessage('ログアウトに失敗しました')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '520px',
        width: '100%'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#1976d2',
          fontSize: '2rem'
        }}>
          メール認証テスト（Magic Link）
        </h1>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>1. Magic Link トークン発行</h2>
          <form onSubmit={handleRequestMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>メールアドレス</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="organizer@example.com"
                required
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>ロール</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AuthRole)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                {ROLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>リダイレクトURL（任意）</span>
              <input
                type="url"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://example.com/login?token=..."
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </label>

            <button
              type="submit"
              disabled={requestStatus === 'loading'}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: requestStatus === 'loading' ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: requestStatus === 'loading' ? 'not-allowed' : 'pointer'
              }}
            >
              {requestStatus === 'loading' ? '発行中...' : 'Magic Linkを発行'}
            </button>
          </form>

          {requestMessage && (
            <p style={{
              marginTop: '0.75rem',
              color: requestStatus === 'error' ? '#c62828' : '#2e7d32'
            }}>
              {requestMessage}
            </p>
          )}

          {issuedToken && (
            <div style={{
              marginTop: '1rem',
              backgroundColor: '#f6f9ff',
              border: '1px solid #bbdefb',
              borderRadius: '4px',
              padding: '1rem'
            }}>
              <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>発行トークン（検証用にコピーしてください）</p>
              <code style={{ wordBreak: 'break-all' }}>{issuedToken}</code>
              {issuedMagicLinkUrl && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Magic Link URL: <code>{issuedMagicLinkUrl}</code>
                </p>
              )}
            </div>
          )}
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>2. Magic Link トークン検証</h2>
          <form onSubmit={handleVerifyMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>トークン</span>
              <textarea
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                rows={3}
                placeholder="発行されたトークンを貼り付けてください"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}
              />
            </label>

            <button
              type="submit"
              disabled={verifyStatus === 'loading'}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: verifyStatus === 'loading' ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: verifyStatus === 'loading' ? 'not-allowed' : 'pointer'
              }}
            >
              {verifyStatus === 'loading' ? '検証中...' : 'トークンを検証してログイン'}
            </button>
          </form>

          {verifyMessage && (
            <p style={{
              marginTop: '0.75rem',
              color: verifyStatus === 'error' ? '#c62828' : '#2e7d32'
            }}>
              {verifyMessage}
            </p>
          )}
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>3. セッション状態</h2>
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0 }}>
              {isLoading
                ? 'セッションを確認中...'
                : JSON.stringify(user ?? { message: '未ログインです' }, null, 2)}
            </pre>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleRefreshSession}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              セッション再取得
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc004e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ログアウト
            </button>
          </div>

          {sessionMessage && (
            <p style={{ marginTop: '0.75rem', color: '#333' }}>{sessionMessage}</p>
          )}
        </section>

        <section style={{ fontSize: '0.9rem', color: '#555' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📌 利用メモ</h2>
          <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.6 }}>
            <li>Magic Linkメール送信は今後実装予定のため、発行トークンをコピーして手動で検証してください。</li>
            <li>LIFF経由のログインは `/liff` ページでテストできます。</li>
            <li>ログイン状態はページ上部のヘッダーにも反映されます。</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
