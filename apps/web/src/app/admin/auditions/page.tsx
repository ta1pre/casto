'use client'

/**
 * オーディション一覧管理画面
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../_hooks/useAdminAuth'

interface Audition {
  id: string
  title: string
  status: 'draft' | 'published' | 'closed'
  application_end_date: string
  created_at: string
  organizer_profiles?: {
    name: string
  }
  _count?: {
    audition_applications: number
  }
}

export default function AuditionsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAdminAuth()
  const [auditions, setAuditions] = useState<Audition[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchAuditions()
    }
  }, [user, statusFilter])

  const fetchAuditions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const res = await fetch(`/api/v1/admin/auditions?${params}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setAuditions(data.auditions || [])
      } else {
        const error = await res.json()
        console.error('API Error:', error)
        alert(`データ取得エラー: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to fetch auditions:', error)
      alert('オーディション一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const filteredAuditions = auditions.filter((audition) => {
    if (searchQuery) {
      return (
        audition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audition.organizer_profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  })

  const handleStatusChange = async (auditionId: string, newStatus: 'draft' | 'published' | 'closed') => {
    const statusLabels = {
      draft: '下書き',
      published: '公開中',
      closed: '終了',
    }

    if (!confirm(`ステータスを「${statusLabels[newStatus]}」に変更しますか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/v1/admin/auditions/${auditionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'ステータス変更に失敗しました')
      }

      // 一覧を再取得
      await fetchAuditions()
      alert(`ステータスを「${statusLabels[newStatus]}」に変更しました`)
    } catch (error) {
      console.error('Status change error:', error)
      alert(error instanceof Error ? error.message : 'ステータスの変更に失敗しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: '下書き', color: 'bg-gray-100 text-gray-800' },
      published: { label: '公開中', color: 'bg-green-100 text-green-800' },
      closed: { label: '終了', color: 'bg-red-100 text-red-800' },
    }
    const { label, color } = config[status as keyof typeof config] || config.draft
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
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
            <h1 className="text-3xl font-bold text-gray-900">オーディション管理</h1>
            <p className="text-gray-500 mt-1">全てのオーディションを一覧表示・管理</p>
          </div>
          <button
            onClick={() => router.push('/admin/auditions/new')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規作成
          </button>
        </div>

        {/* フィルター・検索 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ステータスフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="draft">下書き</option>
                <option value="published">公開中</option>
                <option value="closed">終了</option>
              </select>
            </div>

            {/* 検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトル、主催者名で検索"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* オーディション一覧 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : filteredAuditions.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">オーディションが見つかりません</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    主催者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    締切
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    応募数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAuditions.map((audition) => (
                  <tr key={audition.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {audition.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {audition.organizer_profiles?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(audition.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(audition.application_end_date).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {audition._count?.audition_applications || 0}件
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(audition.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          onClick={() => router.push(`/admin/auditions/${audition.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          詳細
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => router.push(`/admin/auditions/${audition.id}/edit`)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          編集
                        </button>
                        {audition.status === 'draft' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleStatusChange(audition.id, 'published')}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              公開
                            </button>
                          </>
                        )}
                        {audition.status === 'published' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleStatusChange(audition.id, 'closed')}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              終了
                            </button>
                          </>
                        )}
                        {audition.status === 'closed' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleStatusChange(audition.id, 'published')}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              再開
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">総オーディション数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{auditions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">公開中</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {auditions.filter((a) => a.status === 'published').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">下書き</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">
              {auditions.filter((a) => a.status === 'draft').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">終了</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {auditions.filter((a) => a.status === 'closed').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
