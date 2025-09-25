import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { AuthStatus } from '@/components/AuthStatus'

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  if (isAuthenticated && user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem'
      }}>
        <main style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1976d2'
            }}>
              ようこそ、{user.displayName || user.name || 'ゲスト'}さん
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#666'
            }}>
              あなたのロール: <strong>{user.role}</strong>
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {user.role === 'organizer' && (
              <div style={{
                padding: '2rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                textAlign: 'center'
              }}>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>主催者ダッシュボード</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                  オーディションの作成・管理
                </p>
                <a
                  href="/organizer"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc004e',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}
                >
                  ダッシュボードを開く
                </a>
              </div>
            )}

            {user.role === 'applicant' && (
              <div style={{
                padding: '2rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
                textAlign: 'center'
              }}>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>応募者ページ</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                  オーディションの検索・応募
                </p>
                <a
                  href="/liff"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '500'
                  }}
                >
                  応募者ページを開く
                </a>
              </div>
            )}

            <div style={{
              padding: '2rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '1rem', color: '#333' }}>プロフィール</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                アカウント情報の管理
              </p>
              <a
                href="/profile"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#666',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}
              >
                プロフィール編集
              </a>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1976d2' }}>開発環境情報</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              現在の認証プロバイダー: <strong>{user.provider}</strong>
            </p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              API: <a href="http://localhost:8787/api/v1/health" target="_blank" rel="noopener" style={{ color: '#1976d2' }}>Health Check</a>
            </p>
            <AuthStatus />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem'
    }}>
      <main style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1976d2'
        }}>
          casto
        </h1>
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '2rem',
          color: '#666'
        }}>
          オーディション開催から終了まで一元管理できるプラットフォーム
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>主催者</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              募集〜当日運営まで一元管理
            </p>
          </div>
          <div style={{
            padding: '1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>応募者</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              LINEで簡単応募・結果確認
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a
            href="/login"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1976d2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            ログインして始める
          </a>
          <a
            href="/liff"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc004e',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            応募者ページ
          </a>
        </div>
      </main>

      <footer style={{
        marginTop: '3rem',
        fontSize: '0.9rem',
        color: '#999'
      }}>
        <p>開発環境 - API: <a href="http://localhost:8787/api/v1/health" target="_blank" rel="noopener">Health Check</a></p>
      </footer>
    </div>
  );
}
