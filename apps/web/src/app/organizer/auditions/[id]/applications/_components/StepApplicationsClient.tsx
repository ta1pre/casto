/**
 * ステップ対応応募者一覧クライアント
 * [SF][CA] 新しいステップベースの応募管理
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { AuditionApplication, Audition, AuditionStep } from '@casto/shared'
import { TalentProfileModal } from './TalentProfileModal'

export function StepApplicationsClient({ auditionId }: { auditionId: string }) {
  const [audition, setAudition] = useState<Audition | null>(null)
  const [steps, setSteps] = useState<AuditionStep[]>([])
  const [applications, setApplications] = useState<AuditionApplication[]>([])
  const [allApplications, setAllApplications] = useState<AuditionApplication[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedTalent, setSelectedTalent] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditionId])

  // フィルター変更時は既存データから再フィルタリング
  useEffect(() => {
    if (allApplications.length > 0) {
      const filteredApps = allApplications.filter((app: AuditionApplication) => {
        if (filter === 'passed') {
          return app.overallStatus === 'passed' && isFinalStep(app.currentStepId)
        } else if (filter === 'in_progress') {
          return app.overallStatus === 'in_progress' || 
                 (app.overallStatus === 'passed' && !isFinalStep(app.currentStepId))
        } else if (filter === 'all') {
          return app.overallStatus !== 'unread'
        }
        return app.overallStatus === filter
      })
      setApplications(filteredApps)
      setTotalCount(filteredApps.length)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, allApplications, steps])

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
      // 全データを取得（フロントエンドでフィルタリング）
      const url = `/api/v1/organizer/auditions/${auditionId}/applications`
      console.log('[Applications] Fetching:', url)

      const response = await fetch(url, {
        credentials: 'include',
      })

      console.log('[Applications] Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('[Applications] Data received:', data)
        const apps = data.applications || []
        
        // 全データを保存（フィルタリングはuseEffectで実行）
        setAllApplications(apps)
      } else {
        const errorText = await response.text()
        console.error('[Applications] Error response:', response.status, errorText)
      }
    } catch (error) {
      console.error('[Applications] Failed to fetch applications:', error)
    }
  }

  // 最終ステップかどうかを判定
  const isFinalStep = (stepId?: string) => {
    if (!stepId || steps.length === 0) return false
    const maxOrder = Math.max(...steps.map(s => s.stepOrder))
    const currentStep = steps.find(s => s.id === stepId)
    return currentStep?.stepOrder === maxOrder
  }

  // 各ステータスの件数をカウント
  const getCountByStatus = (status: string) => {
    return allApplications.filter((app) => {
      if (status === 'passed') {
        return app.overallStatus === 'passed' && isFinalStep(app.currentStepId)
      } else if (status === 'in_progress') {
        return app.overallStatus === 'in_progress' || 
               (app.overallStatus === 'passed' && !isFinalStep(app.currentStepId))
      } else if (status === 'all') {
        return app.overallStatus !== 'unread'
      }
      return app.overallStatus === status
    }).length
  }

  const getStatusBadge = (application: AuditionApplication) => {
    const status = application.overallStatus
    const badges = {
      unread: 'bg-purple-100 text-purple-800',
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      passed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-300 text-gray-600',
    }
    
    // passedの場合、最終ステップかどうかで表示を変える
    let displayStatus = status
    let displayLabel = ''
    
    if (status === 'passed') {
      if (isFinalStep(application.currentStepId)) {
        // 最終ステップ → 選考通過
        displayLabel = '選考通過'
      } else {
        // 最終ステップ以外 → 審査中
        displayStatus = 'in_progress'
        displayLabel = '審査中'
      }
    } else {
      const labels = {
        unread: '未開封',
        pending: '未審査',
        in_progress: '審査中',
        passed: '選考通過',
        rejected: '不合格',
        withdrawn: '辞退',
      }
      displayLabel = labels[status as keyof typeof labels] || status
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[displayStatus as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {displayLabel}
      </span>
    )
  }

  const getStepName = (stepId?: string) => {
    if (!stepId) return '未設定'
    const step = steps.find(s => s.id === stepId)
    return step ? `${step.stepOrder}. ${step.title}` : '不明'
  }

  // 評価情報から進捗ステータスを取得
  const getProgressStatus = (app: AuditionApplication) => {
    if (!app.evaluations || app.evaluations.length === 0) {
      return { text: '未評価', color: 'text-gray-600' }
    }
    
    const sortedEvals = [...app.evaluations].sort((a, b) => a.stepOrder - b.stepOrder)
    const latestEval = sortedEvals[sortedEvals.length - 1]
    
    if (latestEval.result === 'passed') {
      const scoreText = latestEval.score !== undefined ? ` (${latestEval.score}点)` : ''
      return { 
        text: `${latestEval.stepTitle}通過${scoreText}`, 
        color: 'text-green-700' 
      }
    } else if (latestEval.result === 'rejected') {
      return { 
        text: `${latestEval.stepTitle}不合格`, 
        color: 'text-red-700' 
      }
    } else {
      const scoreText = latestEval.score !== undefined ? ` (${latestEval.score}点)` : ''
      return { 
        text: `${latestEval.stepTitle}審査中${scoreText}`, 
        color: 'text-blue-700' 
      }
    }
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
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            未開封 ({getCountByStatus('unread')})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            未審査 ({getCountByStatus('pending')})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'in_progress'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            審査中 ({getCountByStatus('in_progress')})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'passed'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            選考通過 ({getCountByStatus('passed')})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            不合格 ({getCountByStatus('rejected')})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            開封済みすべて ({getCountByStatus('all')})
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
                {filter === 'unread' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プロフィール入力率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      応募日時
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      選考進捗
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
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedTalent({ id: app.talentId, name: app.talentName || 'タレント' })}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      {app.talentName || 'タレント'}
                    </button>
                  </td>
                  {app.overallStatus === 'unread' ? (
                    /* 未開封行 */
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${app.profileCompletionRate || 0}%` }}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-700">{app.profileCompletionRate || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(app.appliedAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/organizer/auditions/${auditionId}/applications/${app.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          開封する
                        </Link>
                      </td>
                    </>
                  ) : (
                    /* 開封済み行 */
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getProgressStatus(app).color}`}>
                          {getProgressStatus(app).text}
                        </div>
                        {/* 進捗バー */}
                        <div className="flex gap-1 mt-1">
                          {steps.map(step => {
                            const evaluation = app.evaluations?.find(e => e.stepId === step.id)
                            return (
                              <div 
                                key={step.id}
                                className={`h-1.5 w-8 rounded ${
                                  evaluation?.result === 'passed' ? 'bg-green-500' :
                                  evaluation?.result === 'rejected' ? 'bg-red-500' :
                                  evaluation?.result === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-200'
                                }`}
                                title={`${step.title}: ${evaluation?.result === 'passed' ? '通過' : evaluation?.result === 'rejected' ? '不合格' : evaluation?.result === 'pending' ? '審査中' : '未評価'}`}
                              />
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getStepName(app.currentStepId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(app)}
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
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* プロフィールモーダル */}
      <TalentProfileModal
        talentId={selectedTalent?.id || null}
        talentName={selectedTalent?.name || ''}
        isOpen={!!selectedTalent}
        onClose={() => setSelectedTalent(null)}
      />
    </div>
  )
}
