/**
 * 応募者一覧ページ
 * [SF][CA] オーディションへの応募管理
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Application, Audition } from '@casto/shared'

export default function ApplicationsPage({ params }: { params: { id: string } }) {
  const [audition, setAudition] = useState<Audition | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAudition()
    fetchApplications()
  }, [params.id, filter])

  const fetchAudition = async () => {
    try {
      const response = await fetch(`/api/v1/organizer/auditions/${params.id}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setAudition(data.audition)
      }
    } catch (error) {
      console.error('Failed to fetch audition:', error)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filter !== 'all') {
        queryParams.append('status', filter)
      }

      const response = await fetch(
        `/api/v1/organizer/auditions/${params.id}/applications?${queryParams}`,
        {
          credentials: 'include',
        }
      )

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/organizer/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchApplications()
      } else {
        alert('ステータスの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('ネットワークエラーが発生しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      submitted: '審査中',
      under_review: '審査中',
      accepted: '合格',
      rejected: '不合格',
      withdrawn: '辞退',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={`/organizer/auditions/${params.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          オーディション詳細に戻る
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">応募者一覧</h1>
          {audition && <p className="text-gray-500 mt-1">{audition.title}</p>}
        </div>
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
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'submitted' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            審査中
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'accepted' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            合格
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1 text-sm rounded-md ${filter === 'rejected' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            不合格
          </button>
        </div>
      </div>

      {/* 応募者一覧 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      ) : applications.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">応募者がいません</h3>
          <p className="mt-1 text-sm text-gray-500">応募が届くまでお待ちください</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  応募者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  応募日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.applicantProfile.stageName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.applicantProfile.prefecture}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(application.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {application.status === 'submitted' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'accepted')}
                          className="text-green-600 hover:text-green-900"
                        >
                          合格
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(application.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          不合格
                        </button>
                      </div>
                    )}
                    <Link
                      href={`/organizer/applications/${application.id}`}
                      className="text-gray-900 hover:text-gray-700 ml-4"
                    >
                      詳細
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
