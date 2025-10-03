import { useCallback, useEffect, useState } from 'react'
import type { UserResponse, UsersListResponse, UsersStats } from '@casto/shared'

interface UseUsersDataResult {
  users: UserResponse[]
  stats: UsersStats | null
  lastFetchedAt: string | null
  loading: boolean
  error: string | null
  refresh: () => void
}

const parseUsersPayload = (payload: unknown): UsersListResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const typedPayload = payload as Partial<UsersListResponse>

  if (!Array.isArray(typedPayload.users)) {
    return null
  }

  return {
    users: typedPayload.users as UserResponse[],
    count: typeof typedPayload.count === 'number' ? typedPayload.count : typedPayload.users.length,
    fetchedAt: typeof typedPayload.fetchedAt === 'string' ? typedPayload.fetchedAt : new Date().toISOString(),
    stats: typedPayload.stats ?? {
      total: typedPayload.users.length,
      active: 0,
      inactive: 0,
      byProvider: {},
      byRole: {}
    }
  }
}

export function useUsersData(apiBase?: string): UseUsersDataResult {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [stats, setStats] = useState<UsersStats | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
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

      const usersPayload = parseUsersPayload(payload)

      if (!usersPayload) {
        throw new Error('レスポンス形式が不正です')
      }

      console.log('✅ [API] 取得成功:', usersPayload)
      setUsers(usersPayload.users)
      setStats(usersPayload.stats ?? null)
      setLastFetchedAt(usersPayload.fetchedAt)
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
    stats,
    lastFetchedAt,
    loading,
    error,
    refresh: fetchUsers
  }
}
