/**
 * オーディション種別管理フック
 * [SF][CA][REH] 管理者向け種別設定の取得・更新
 */

import { useState, useEffect } from 'react'
import type { AuditionType, UpdateAuditionTypeRequest } from '@casto/shared'

interface UseAuditionTypesReturn {
  types: AuditionType[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 全種別を取得（管理者のみ）
 */
export function useAuditionTypes(): UseAuditionTypesReturn {
  const [types, setTypes] = useState<AuditionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTypes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/audition-types/all', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('種別の取得に失敗しました')
      }

      const data = await response.json()
      setTypes(data.types || [])
    } catch (err) {
      console.error('[useAuditionTypes] Error:', err)
      setError(err instanceof Error ? err.message : '種別の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  return {
    types,
    loading,
    error,
    refetch: fetchTypes,
  }
}

interface UseUpdateAuditionTypeReturn {
  updateType: (typeId: string, updates: UpdateAuditionTypeRequest) => Promise<boolean>
  loading: boolean
  error: string | null
}

/**
 * 種別を更新（管理者のみ）
 */
export function useUpdateAuditionType(): UseUpdateAuditionTypeReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateType = async (
    typeId: string,
    updates: UpdateAuditionTypeRequest
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/audition-types/${typeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '種別の更新に失敗しました')
      }

      return true
    } catch (err) {
      console.error('[useUpdateAuditionType] Error:', err)
      setError(err instanceof Error ? err.message : '種別の更新に失敗しました')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    updateType,
    loading,
    error,
  }
}
