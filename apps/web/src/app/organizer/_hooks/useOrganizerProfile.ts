/**
 * 主催者プロフィールフック
 * [SF][DRY][REH] プロフィールデータの取得・更新
 */

import { useState, useEffect } from 'react'
import type {
  OrganizerProfile,
  OrganizerProfileUpsertRequest,
} from '@casto/shared'

interface UseOrganizerProfileResult {
  profile: OrganizerProfile | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProfile: (data: OrganizerProfileUpsertRequest) => Promise<void>
}

/**
 * 主催者プロフィールフック
 */
export function useOrganizerProfile(): UseOrganizerProfileResult {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/v1/organizer/profile', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.status === 404) {
        // プロフィール未作成
        setProfile(null)
        return
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Profile fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(errorData.error || errorData.details || 'Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data.profile)
    } catch (err) {
      console.error('Profile fetch exception:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: OrganizerProfileUpsertRequest) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/v1/organizer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      setProfile(result.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
    updateProfile,
  }
}
