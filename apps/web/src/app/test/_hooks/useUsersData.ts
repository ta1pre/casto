import { useCallback, useEffect, useState } from 'react'
import type { UserResponse } from '@casto/shared'

type User = UserResponse

interface UseUsersDataResult {
  users: User[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useUsersData(apiBase?: string): UseUsersDataResult {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!apiBase) {
      setError('APIベースURLが設定されていません')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = `${apiBase}/api/v1/users`
      console.log('🔍 [API] users一覧を取得中...', url)

      const response = await fetch(url, {
        credentials: 'include'
      })

      const payload = await response.json()

      if (!response.ok) {
        console.error('❌ [API] レスポンスエラー:', response.status, payload)
        const message = typeof payload?.error === 'string' ? payload.error : 'APIエラーが発生しました'
        throw new Error(message)
      }

      const usersData = Array.isArray(payload?.users) ? payload.users : []

      console.log('✅ [API] 取得成功:', usersData)
      setUsers(usersData as User[])
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : '不明なエラー'
      console.error('💥 [API] データ取得失敗:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    refresh: fetchUsers
  }
}
