/**
 * オーディション一覧ページ
 * [SF][CA] 主催者向けオーディション管理
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Audition } from '@casto/shared'

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<Audition[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('all')

  useEffect(() => {
    fetchAuditions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchAuditions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/v1/organizer/auditions?${params}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAuditions(data.auditions || [])
      }
    } catch (error) {
      console.error('Failed to fetch auditions:', error)
    } finally {
      setLoading(false)
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">オーディション管理</h1>
          <p className="text-gray-500 mt-1">オーディション・求人の作成・管理</p>
        </div>
        <Link
          href="/organizer/auditions/new"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Link>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">ステータス:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'draft' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            下書き
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'published' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            公開中
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'closed' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            終了
          </button>
        </div>
      </div>

      {/* オーディション一覧 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : auditions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">オーディションがありません</h3>
          <p className="mt-1 text-sm text-gray-500">新しいオーディションを作成してください</p>
          <div className="mt-6">
            <Link
              href="/organizer/auditions/new"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              新規作成
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {auditions.map((audition) => (
            <div
              key={audition.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{audition.title}</h3>
                    {getStatusBadge(audition.status)}
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {audition.projectType === 'audition'
                        ? 'オーディション'
                        : audition.projectType === 'job'
                        ? '求人'
                        : 'エキストラ募集'}
                    </span>
                  </div>
                  {audition.shortDescription && (
                    <p className="text-sm text-gray-600 mb-3">{audition.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      募集期間: {new Date(audition.applicationStartDate).toLocaleDateString()} 〜{' '}
                      {new Date(audition.applicationEndDate).toLocaleDateString()}
                    </span>
                    {audition.maxApplicants && (
                      <span>定員: {audition.maxApplicants}名</span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <Link
                    href={`/organizer/auditions/${audition.id}`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
                  >
                    詳細を見る
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  最終更新: {new Date(audition.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                  <Link
                    href={`/organizer/auditions/${audition.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    詳細ページへ
                  </Link>
                  <Link
                    href={`/organizer/auditions/${audition.id}/applications`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    応募者一覧
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
