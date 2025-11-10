/**
 * Admin オーディション詳細クライアントコンポーネント
 * [SF][CA][REH] シンプル、クリーンアーキテクチャ、堅牢なエラーハンドリング
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '../../../_hooks/useAdminAuth'

interface Audition {
  id: string
  title: string
  description?: string
  requirements?: string
  shortDescription?: string
  coverImageUrl?: string
  coverImageAlt?: string
  mainVisualUrl?: string
  mainVisualType?: string
  applicationStartDate: string
  applicationEndDate: string
  maxApplicants?: number
  status: 'draft' | 'published' | 'closed'
  projectType: 'audition' | 'job' | 'extra'
  adminDisplayLabelId?: string
  createdAt: string
  updatedAt: string
  organizer_profiles?: {
    name: string
  }
  admin_display_labels?: {
    label: string
  }
  _count?: {
    audition_applications: number
  }
}

// 安全な日付フォーマット関数
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

export function AuditionDetailPageClient({ auditionId }: { auditionId: string }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAdminAuth()
  const [audition, setAudition] = useState<Audition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchAudition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, auditionId])

  const fetchAudition = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/admin/auditions/${auditionId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'オーディションの取得に失敗しました')
      }

      const data = await response.json()
      setAudition(data.audition)
    } catch (err) {
      console.error('Failed to fetch audition:', err)
      setError(err instanceof Error ? err.message : 'オーディションの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'closed') => {
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
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'ステータス変更に失敗しました')
      }

      await fetchAudition()
      alert(`ステータスを「${statusLabels[newStatus]}」に変更しました`)
    } catch (err) {
      console.error('Status change error:', err)
      alert(err instanceof Error ? err.message : 'ステータスの変更に失敗しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { label: '下書き', color: 'bg-gray-100 text-gray-800' },
      published: { label: '公開中', color: 'bg-green-100 text-green-800' },
      closed: { label: '終了', color: 'bg-red-100 text-red-800' },
    }
    const { label, color } = config[status as keyof typeof config] || config.draft
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>{label}</span>
  }

  const getProjectTypeBadge = (type: string) => {
    const config = {
      audition: { label: 'オーディション', color: 'bg-blue-100 text-blue-800' },
      job: { label: '求人', color: 'bg-purple-100 text-purple-800' },
      extra: { label: 'エキストラ募集', color: 'bg-orange-100 text-orange-800' },
    }
    const { label, color } = config[type as keyof typeof config] || config.audition
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>{label}</span>
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

  if (error || !audition) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <p className="font-medium">{error || 'オーディションが見つかりません'}</p>
            <button
              onClick={() => router.push('/admin/auditions')}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              オーディション一覧に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/auditions')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 一覧に戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900">オーディション詳細</h1>
          </div>
          <button
            onClick={() => router.push(`/admin/auditions/${auditionId}/edit`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            編集
          </button>
        </div>

        {/* ステータス・種別バッジ */}
        <div className="flex items-center gap-3">
          {getStatusBadge(audition.status)}
          {getProjectTypeBadge(audition.projectType)}
          {audition.admin_display_labels && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              表示ラベル: {audition.admin_display_labels.label}
            </span>
          )}
        </div>

        {/* ステータス変更ボタン */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ステータス管理</h2>
          <div className="flex gap-3">
            {audition.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                公開する
              </button>
            )}
            {audition.status === 'published' && (
              <button
                onClick={() => handleStatusChange('closed')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                終了する
              </button>
            )}
            {audition.status === 'closed' && (
              <button
                onClick={() => handleStatusChange('published')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                再開する
              </button>
            )}
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <p className="text-gray-900">{audition.title}</p>
            </div>
            {audition.shortDescription && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">短い説明</label>
                <p className="text-gray-900">{audition.shortDescription}</p>
              </div>
            )}
            {audition.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">詳細説明</label>
                <p className="text-gray-900 whitespace-pre-wrap">{audition.description}</p>
              </div>
            )}
            {audition.requirements && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
                <p className="text-gray-900 whitespace-pre-wrap">{audition.requirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* 募集情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">募集情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">募集開始日時</label>
              <p className="text-gray-900">
                {formatDate(audition.applicationStartDate)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">募集終了日時</label>
              <p className="text-gray-900">
                {formatDate(audition.applicationEndDate)}
              </p>
            </div>
            {audition.maxApplicants && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">定員</label>
                <p className="text-gray-900">{audition.maxApplicants}名</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">応募数</label>
              <p className="text-gray-900">{audition._count?.audition_applications || 0}件</p>
            </div>
          </div>
        </div>

        {/* メインビジュアル */}
        {audition.mainVisualUrl && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">メインビジュアル</h2>
            {audition.mainVisualType === 'video' ? (
              <video
                src={audition.mainVisualUrl}
                controls
                className="w-full max-w-2xl rounded-lg"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={audition.mainVisualUrl}
                alt={audition.coverImageAlt || audition.title}
                className="w-full max-w-2xl rounded-lg"
              />
            )}
          </div>
        )}

        {/* メタ情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">メタ情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-700 font-medium mb-1">作成日時</label>
              <p className="text-gray-900">{formatDate(audition.createdAt)}</p>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">更新日時</label>
              <p className="text-gray-900">{formatDate(audition.updatedAt)}</p>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">オーディションID</label>
              <p className="text-gray-600 font-mono text-xs">{audition.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
