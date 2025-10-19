'use client'

/**
 * メッセージ配信管理画面
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useState, useEffect } from 'react'
import { useAdminAuth } from '../_hooks/useAdminAuth'
import { FriendshipStats } from './_components/FriendshipStats'
import { MessagingQuota } from './_components/MessagingQuota'
import { BroadcastActions } from './_components/BroadcastActions'
import { SendHistory } from './_components/SendHistory'
import { UserFriendshipList } from './_components/UserFriendshipList'
import { LineMessageComposer } from './_components/LineMessageComposer'
import { EmailMessageComposer } from './_components/EmailMessageComposer'

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

type Tab = 'line' | 'email'

export default function MessagingPage() {
  const { user, isLoading: authLoading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<Tab>('line')
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">メッセージ配信</h1>
            <p className="text-gray-500 mt-1">LINEメッセージとメール配信を管理</p>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('line')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'line'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                LINE配信
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                メール配信
              </div>
            </button>
          </nav>
        </div>

        {/* LINEタブ */}
        {activeTab === 'line' && (
          <>
            {/* 友だち追加状態 */}
            <FriendshipStats stats={friendshipStats} loading={loading} />

            {/* 無料枠モニター */}
            <MessagingQuota stats={messagingStats} loading={loading} />

            {/* LINE配信フォーム */}
            <LineMessageComposer onSendSuccess={fetchData} />

            {/* 配信アクション */}
            <BroadcastActions
              sending={sending}
              onSendWeeklySummary={handleSendWeeklySummary}
            />

            {/* 送信履歴 */}
            <SendHistory history={history} loading={loading} />

            {/* ユーザー一覧 */}
            <UserFriendshipList />
          </>
        )}

        {/* メールタブ */}
        {activeTab === 'email' && (
          <>
            {/* メール配信フォーム */}
            <EmailMessageComposer onSendSuccess={fetchData} />

            {/* 今後の拡張 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">今後の拡張予定</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>メールテンプレート管理</li>
                <li>一括配信機能</li>
                <li>送信履歴表示</li>
                <li>AWS SES連携</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
