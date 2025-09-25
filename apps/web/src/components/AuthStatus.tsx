import React from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        margin: '1rem 0',
        fontSize: '0.9rem',
        color: '#666'
      }}>
        🔄 認証状態を確認中...
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        margin: '1rem 0',
        fontSize: '0.9rem',
        color: '#856404'
      }}>
        ❌ 未認証状態
        <br />
        <small>ログインして認証状態を確認してください</small>
      </div>
    )
  }

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      borderRadius: '4px',
      margin: '1rem 0',
      fontSize: '0.9rem',
      color: '#155724'
    }}>
      ✅ 認証済み
      <br />
      <strong>ユーザーID:</strong> {user.id}
      <br />
      <strong>表示名:</strong> {user.displayName || user.name || '未設定'}
      <br />
      <strong>メール:</strong> {user.email || '未設定'}
      <br />
      <strong>プロバイダー:</strong> {user.provider}
      <br />
      <strong>ロール:</strong> {user.role}
      <br />
      <small>認証状態は正常に動作しています</small>
    </div>
  )
}
