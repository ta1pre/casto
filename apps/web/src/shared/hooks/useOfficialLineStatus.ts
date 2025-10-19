'use client'

import { useState, useEffect } from 'react'
import { useLiffAuth } from './useLiffAuth'

/**
 * LINE公式アカウント友だち追加状態取得フック
 * 
 * liff.getFriendship() を使用して友だち追加状態を取得します。
 * 
 * [SF][PA][REH] - シンプル、パフォーマンス、堅牢なエラーハンドリング
 */

interface UseOfficialLineStatusReturn {
  isFriend: boolean | null        // true: 友だち追加済み, false: 未追加, null: 不明
  loading: boolean                 // 取得中
  error: string | null             // エラーメッセージ
  refetch: () => Promise<void>     // 再取得
  lastCheckedAt: number | null     // 最終確認日時（Unix timestamp）
}

export function useOfficialLineStatus(): UseOfficialLineStatusReturn {
  const { isLiffReady } = useLiffAuth()
  const [isFriend, setIsFriend] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)

  // 友だち追加状態取得ロジック
  const fetchFriendship = async () => {
    // LIFF未初期化の場合はスキップ
    if (!isLiffReady || typeof window === 'undefined' || !window.liff) {
      setIsFriend(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // liff.getFriendship() で友だち追加状態を取得
      if (!window.liff.getFriendship) {
        // getFriendshipメソッドが利用できない場合（古いSDKバージョンなど）
        console.warn('[useOfficialLineStatus] getFriendship method is not available')
        setIsFriend(null)
        return
      }
      
      const friendship = await window.liff.getFriendship()
      setIsFriend(friendship.friendFlag)
      setLastCheckedAt(Date.now())
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[useOfficialLineStatus] Friendship status:', friendship.friendFlag)
      }
    } catch (err: any) {
      // API未許可（403）: 認証審査前などで取得できない場合
      if (err.code === 403 || err.message?.includes('403')) {
        console.warn('[useOfficialLineStatus] Friendship API not permitted (403). This is expected for unapproved apps.')
        setIsFriend(null) // 不明として扱う
      } else {
        // その他のエラー
        console.error('[useOfficialLineStatus] Error fetching friendship:', err)
        setError(err.message || 'Unknown error')
        setIsFriend(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // LIFF準備完了後に友だち追加状態を取得
  useEffect(() => {
    if (isLiffReady) {
      fetchFriendship()
    }
  }, [isLiffReady])

  return {
    isFriend,
    loading,
    error,
    refetch: fetchFriendship,
    lastCheckedAt
  }
}
