/**
 * プロフィールデータフック
 * 
 * [SF][REH] プロフィール取得・保存・状態管理
 */

import { useState, useEffect, useCallback } from 'react'
import type { TalentProfileInput, TalentProfileResponse } from '@casto/shared'
import { fetchProfile, saveProfile } from '../api/profile'

interface UseProfileDataResult {
  profile: TalentProfileResponse | null
  loading: boolean
  error: unknown
  refetch: () => Promise<void>
  save: (input: TalentProfileInput) => Promise<TalentProfileResponse>
}

/**
 * プロフィールデータの取得・保存・状態管理フック
 */
export function useProfileData(): UseProfileDataResult {
  const [profile, setProfile] = useState<TalentProfileResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<unknown>(null)

  // プロフィール取得
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchProfile()
      setProfile(data)
    } catch (err) {
      // 404は初回作成前なので正常扱い
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        setProfile(null)
      } else {
        // エラーオブジェクト全体を保存（デバッグ情報のため）
        setError(err)
        console.error('[useProfileData] Fetch error:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // プロフィール保存
  const save = useCallback(async (input: TalentProfileInput): Promise<TalentProfileResponse> => {
    setError(null)

    try {
      const saved = await saveProfile(input)
      setProfile(saved)
      return saved
    } catch (err) {
      // エラーオブジェクト全体を保存（デバッグ情報のため）
      setError(err)
      console.error('[useProfileData] Save error:', err)
      throw err
    }
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchData,
    save
  }
}
