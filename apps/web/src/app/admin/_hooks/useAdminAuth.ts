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
        const status = response.status
        const errorMessage = status === 401 ? 'SessionExpired' : 'Session not found'
        throw Object.assign(new Error(errorMessage), { status })
      }

      const data = await response.json()
      setUser(data)
    } catch (err) {
      const status = (err as { status?: number }).status
      const message = err instanceof Error ? err.message : 'Authentication failed'

      if (status === 401) {
        setError('セッションが切れました。再度ログインしてください。')
        router.replace('/admin/login?reason=session-expired')
        return
      }

      setError(message)
      // その他の認証エラーの場合はログインページへリダイレクト
      router.replace('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // クッキーをクリア（正しいクッキー名で）
    document.cookie = 'casto_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/admin/login')
  }

  return {
    user,
    isLoading,
    error,
    logout,
  }
}
