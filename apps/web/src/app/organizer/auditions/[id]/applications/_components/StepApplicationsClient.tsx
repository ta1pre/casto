/**
 * ステップ対応応募者一覧クライアント
 * [SF][CA] 新しいステップベースの応募管理
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { AuditionApplication, Audition, AuditionStep } from '@casto/shared'

export function StepApplicationsClient({ auditionId }: { auditionId: string }) {
  const [audition, setAudition] = useState<Audition | null>(null)
  const [steps, setSteps] = useState<AuditionStep[]>([])
  const [applications, setApplications] = useState<AuditionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditionId, filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchAudition(),
        fetchSteps(),
        fetchApplications(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchAudition = async () => {
    try {
      const response = await fetch(`/api/v1/organizer/auditions/${auditionId}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Audition] Data received:', data)
        setAudition(data.audition)
      } else {
        console.error('[Audition] Error response:', response.status)
      }
    } catch (error) {
      console.error('[Audition] Failed to fetch:', error)
    }
  }

  const fetchSteps = async () => {
    try {
      const response = await fetch(`/api/v1/organizer/auditions/${auditionId}/steps`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Steps] Data received:', data)
        setSteps(data.steps || [])
      } else {
        console.error('[Steps] Error response:', response.status)
      }
    } catch (error) {
      console.error('[Steps] Failed to fetch:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filter !== 'all') {
        queryParams.append('status', filter)
      }

      const url = `/api/v1/organizer/auditions/${auditionId}/applications?${queryParams}`
      console.log('[Applications] Fetching:', url)

      const response = await fetch(url, {
        credentials: 'include',
      })

      console.log('[Applications] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Applications] Data received:', data)
        setApplications(data.applications || [])
      } else {
        const errorText = await response.text()
        console.error('[Applications] Error response:', response.status, errorText)
      }
    } catch (error) {
      console.error('[Applications] Failed to fetch applications:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      passed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-300 text-gray-600',
    }
    const labels = {
      pending: '未審査',
      in_progress: '審査中',
      passed: '合格',
      rejected: '不合格',
      withdrawn: '辞退',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getStepName = (stepId?: string) => {
    if (!stepId) return '未設定'
    const step = steps.find(s => s.id === stepId)
    return step ? `${step.stepOrder}. ${step.title}` : '不明'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={`/organizer/auditions/${auditionId}`}
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← オーディション詳細に戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          応募者管理
        </h1>
        {audition && (
          <p className="text-gray-600 mt-2">{audition.title}</p>
        )}
      </div>

      {/* ステータスフィルタ */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            すべて ({applications.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            未審査
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'in_progress'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            審査中
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'passed'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            合格
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            不合格
          </button>
        </div>
      </div>

      {/* 応募者一覧 */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">
            {filter === 'all' ? '応募者がいません' : 'このステータスの応募者はいません'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  応募者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  現在のステップ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  応募日時
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {app.talentName || 'タレント'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {app.talentId.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getStepName(app.currentStepId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(app.overallStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.appliedAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/organizer/auditions/${auditionId}/applications/${app.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      詳細・評価
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
