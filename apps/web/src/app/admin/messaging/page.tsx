'use client'

/**
 * LINE配信管理画面
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useState, useEffect } from 'react'
import { useAdminAuth } from '../_hooks/useAdminAuth'

interface MessagingStats {
  monthlyQuota: number
  sent: number
  remaining: number
  exceeded: boolean
  percentage: number
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
  const [stats, setStats] = useState<MessagingStats | null>(null)
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
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/v1/internal/messaging/stats', {
          credentials: 'include'
        }),
        fetch('/api/v1/internal/messaging/history?limit=10', {
          credentials: 'include'
        })
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setHistory(historyData.logs || [])
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">LINE配信管理</h1>

        {/* 無料枠モニター */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">無料枠残量</h2>
          {stats && (
            <div>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-4xl font-bold text-blue-600">
                  {stats.remaining}
                </div>
                <div className="text-gray-600 mb-1">/ {stats.monthlyQuota}通</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    stats.percentage >= 90 ? 'bg-red-500' : 
                    stats.percentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                今月の使用量: {stats.sent}通 ({stats.percentage}%)
                {stats.exceeded && (
                  <span className="ml-2 text-red-600 font-medium">⚠️ 無料枠を超過しています</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 配信アクション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">配信アクション</h2>
          <div className="space-y-3">
            <button
              onClick={handleSendWeeklySummary}
              disabled={sending}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {sending ? '配信中...' : '📮 週次まとめを配信'}
            </button>
            <p className="text-sm text-gray-500">
              ※ 過去7日間の新着オーディションを友だち追加済みユーザー全員に配信します
            </p>
          </div>
        </div>

        {/* 送信履歴 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">送信履歴</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">送信日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイプ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">成功</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">失敗</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      送信履歴がありません
                    </td>
                  </tr>
                ) : (
                  history.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.sent_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.message_type === 'weekly_summary' ? '週次まとめ' : 
                         log.message_type === 'audition_announcement' ? 'オーディション告知' : 
                         'カスタム'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.recipient_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {log.success_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {log.failed_count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
