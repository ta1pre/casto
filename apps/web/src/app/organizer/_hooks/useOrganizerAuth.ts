/**
 * 主催者認証フック
 * [SF][DRY] 認証状態の管理とセッション確認
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface OrganizerUser {
  userId: string
  roles: string[]
  provider: string
}

export function useOrganizerAuth() {
  const router = useRouter()
  const [user, setUser] = useState<OrganizerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/v1/organizer/auth/session', {
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
      router.push('/organizer/login')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // クッキーをクリア（正しいクッキー名で）
    document.cookie = 'casto_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/organizer/login')
  }

  return {
    user,
    isLoading,
    error,
    logout,
  }
}
