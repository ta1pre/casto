import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'line'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      alert('メールアドレスとパスワードを入力してください')
      return
    }

    setIsLoading(true)
    try {
      // 実際の認証処理はここに実装
      // 今回はデモとして固定のユーザー情報でログイン
      const mockUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: email.split('@')[0],
        provider: 'email' as const,
        role: 'applicant' as const
      }

      login(mockUser)
      alert('ログインしました！')
    } catch (error) {
      console.error('Login failed:', error)
      alert('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = (role: 'applicant' | 'organizer') => {
    const testUser = {
      id: `test-${role}-${Date.now()}`,
      email: `test.${role}@example.com`,
      name: `テスト${role === 'applicant' ? '応募者' : '主催者'}`,
      displayName: `テスト${role === 'applicant' ? '応募者' : '主催者'}`,
      provider: 'email' as const,
      role: role
    }
    login(testUser)
    alert(`${role === 'applicant' ? '応募者' : '主催者'}としてログインしました！`)
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
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#1976d2',
          fontSize: '2rem'
        }}>
          Casto ログイン
        </h1>

        <div style={{
          display: 'flex',
          marginBottom: '2rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setLoginMethod('email')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              backgroundColor: loginMethod === 'email' ? '#1976d2' : 'transparent',
              color: loginMethod === 'email' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            メールログイン
          </button>
          <button
            onClick={() => setLoginMethod('line')}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: 'none',
              backgroundColor: loginMethod === 'line' ? '#1976d2' : 'transparent',
              color: loginMethod === 'line' ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            LINEログイン
          </button>
        </div>

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="your@email.com"
                required
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: '#333'
              }}>
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="パスワード"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: isLoading ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem'
              }}
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        ) : (
          <div>
            <p style={{
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#666',
              lineHeight: '1.5'
            }}>
              LINEアプリ内で認証を行います。<br />
              応募者の方は自動的にログインされます。
            </p>

            <button
              onClick={() => handleQuickLogin('applicant')}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#00c300',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>LINEでログイン（テスト用）</span>
            </button>
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.9rem',
            color: '#666',
            margin: 0,
            marginBottom: '1rem'
          }}>
            デモ環境ではテスト用アカウントでログインできます
          </p>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => handleQuickLogin('applicant')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              テスト応募者としてログイン
            </button>
            <button
              onClick={() => handleQuickLogin('organizer')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc004e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              テスト主催者としてログイン
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
