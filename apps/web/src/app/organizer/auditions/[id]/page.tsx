/**
 * オーディション詳細ページ
 * [SF][CA] 詳細表示・編集・応募者一覧
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Audition } from '@casto/shared'

export default function AuditionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [audition, setAudition] = useState<Audition | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchAudition()
  }, [params.id])

  const fetchAudition = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizer/auditions/${params.id}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAudition(data.audition)
      } else {
        router.push('/organizer/auditions')
      }
    } catch (error) {
      console.error('Failed to fetch audition:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!audition) return

    try {
      setUpdating(true)
      const response = await fetch(`/api/v1/organizer/auditions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        setAudition(data.audition)
      } else {
        alert('ステータスの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setUpdating(false)
    }
  }

  const deleteAudition = async () => {
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/organizer/auditions/${params.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        router.push('/organizer/auditions')
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete audition:', error)
      alert('ネットワークエラーが発生しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      draft: '下書き',
      published: '公開中',
      closed: '終了',
      cancelled: '中止',
    }
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!audition) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href="/organizer/auditions"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{audition.title}</h1>
              {getStatusBadge(audition.status)}
            </div>
            <p className="text-gray-500">
              作成日: {new Date(audition.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/organizer/auditions/${params.id}/edit`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              編集
            </Link>
            <button
              onClick={deleteAudition}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            <div className="space-y-4">
              {audition.shortDescription && (
                <div>
                  <p className="text-sm font-medium text-gray-500">短い説明</p>
                  <p className="text-gray-900 mt-1">{audition.shortDescription}</p>
                </div>
              )}
              {audition.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">詳細説明</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{audition.description}</p>
                </div>
              )}
              {audition.requirements && (
                <div>
                  <p className="text-sm font-medium text-gray-500">応募条件</p>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{audition.requirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* ジャンル */}
          {audition.genres && audition.genres.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ジャンル</h2>
              <div className="flex flex-wrap gap-2">
                {audition.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                  >
                    {genre.displayName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 応募者一覧へのリンク */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">応募管理</h2>
            <Link
              href={`/organizer/auditions/${params.id}/applications`}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              応募者一覧を見る
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* ステータス管理 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ステータス管理</h2>
            <div className="space-y-2">
              {audition.status === 'draft' && (
                <button
                  onClick={() => updateStatus('published')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  公開する
                </button>
              )}
              {audition.status === 'published' && (
                <>
                  <button
                    onClick={() => updateStatus('closed')}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    募集を終了する
                  </button>
                  <button
                    onClick={() => updateStatus('draft')}
                    disabled={updating}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    下書きに戻す
                  </button>
                </>
              )}
              {audition.status === 'closed' && (
                <button
                  onClick={() => updateStatus('published')}
                  disabled={updating}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  再公開する
                </button>
              )}
            </div>
          </div>

          {/* 募集情報 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">募集情報</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">種別</p>
                <p className="text-gray-900 mt-1">
                  {audition.projectType === 'audition' ? 'オーディション' : '求人'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">募集期間</p>
                <p className="text-gray-900 mt-1">
                  {new Date(audition.applicationStartDate).toLocaleDateString()}
                  <br />〜 {new Date(audition.applicationEndDate).toLocaleDateString()}
                </p>
              </div>
              {audition.maxApplicants && (
                <div>
                  <p className="text-sm font-medium text-gray-500">定員</p>
                  <p className="text-gray-900 mt-1">{audition.maxApplicants}名</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
