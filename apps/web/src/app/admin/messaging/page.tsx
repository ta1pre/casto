'use client'

/**
 * LINE配信管理画面
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useState, useEffect } from 'react'
import { useAdminAuth } from '../_hooks/useAdminAuth'
import { FriendshipStats } from './_components/FriendshipStats'
import { MessagingQuota } from './_components/MessagingQuota'
import { BroadcastActions } from './_components/BroadcastActions'
import { SendHistory } from './_components/SendHistory'
import { UserFriendshipList } from './_components/UserFriendshipList'

interface MessagingStats {
  monthlyQuota: number
  sent: number
  remaining: number
  exceeded: boolean
  percentage: number
}

interface FriendshipStatsData {
  total: number
  friends: number
  blocked: number
  unknown: number
}

interface SendHistory {
  id: string
  message_type: string
  recipient_count: number
  success_count: number
  failed_count: number
  sent_at: string
}

export default function MessagingPage() {
  const { user, isLoading: authLoading } = useAdminAuth()
  const [messagingStats, setMessagingStats] = useState<MessagingStats | null>(null)
  const [friendshipStats, setFriendshipStats] = useState<FriendshipStatsData | null>(null)
  const [history, setHistory] = useState<SendHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [messagingRes, friendshipRes, historyRes] = await Promise.all([
        fetch('/api/v1/internal/messaging/stats', {
          credentials: 'include'
        }),
        fetch('/api/v1/internal/messaging/friendship-stats', {
          credentials: 'include'
        }),
        fetch('/api/v1/internal/messaging/history?limit=10', {
          credentials: 'include'
        })
      ])

      if (messagingRes.ok) {
        const data = await messagingRes.json()
        setMessagingStats(data)
      }

      if (friendshipRes.ok) {
        const data = await friendshipRes.json()
        setFriendshipStats(data)
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendWeeklySummary = async () => {
    if (!confirm('週次まとめを配信しますか？')) return

    try {
      setSending(true)
      const res = await fetch('/api/v1/internal/messaging/weekly-summary', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const result = await res.json()
        alert(`配信完了: ${result.sent}件送信、${result.failed}件失敗`)
        fetchData()
      } else {
        const error = await res.json()
        alert(`配信失敗: ${error.error}`)
      }
    } catch (error) {
      alert('配信エラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">認証中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">LINE配信管理</h1>

        {/* 友だち追加状態 */}
        <FriendshipStats stats={friendshipStats} loading={loading} />

        {/* 無料枠モニター */}
        <MessagingQuota stats={messagingStats} loading={loading} />

        {/* 配信アクション */}
        <BroadcastActions
          sending={sending}
          onSendWeeklySummary={handleSendWeeklySummary}
        />

        {/* 送信履歴 */}
        <SendHistory history={history} loading={loading} />

        {/* ユーザー一覧 */}
        <UserFriendshipList />
      </div>
    </div>
  )
}
