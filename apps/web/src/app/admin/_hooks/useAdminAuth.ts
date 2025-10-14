/**
 * 管理者認証フック
 * [SF][DRY] 認証状態の管理とセッション確認
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  userId: string
  roles: string[]
  provider: string
}

export function useAdminAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/v1/admin/auth/session', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Session not found')
      }

      const data = await response.json()
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      // 認証エラーの場合はログインページへリダイレクト
      router.push('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // クッキーをクリア（簡易版）
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/admin/login')
  }

  return {
    user,
    isLoading,
    error,
    logout,
  }
}
