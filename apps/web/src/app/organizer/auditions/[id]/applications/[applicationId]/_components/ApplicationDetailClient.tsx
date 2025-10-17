/**
 * 応募詳細・評価クライアント
 * [SF][CA] ステップごとの評価とステータス管理
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { AuditionApplication, AuditionStep, AuditionEvaluation } from '@casto/shared'

interface ApplicationDetailClientProps {
  auditionId: string
  applicationId: string
}

export function ApplicationDetailClient({ auditionId, applicationId }: ApplicationDetailClientProps) {
  const [application, setApplication] = useState<AuditionApplication | null>(null)
  const [steps, setSteps] = useState<AuditionStep[]>([])
  const [evaluations, setEvaluations] = useState<AuditionEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluatingStepId, setEvaluatingStepId] = useState<string | null>(null)
  const [evaluationForm, setEvaluationForm] = useState({
    score: '',
    comments: '',
    result: 'pending' as 'pending' | 'passed' | 'rejected',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditionId, applicationId])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchApplication(),
        fetchSteps(),
        fetchEvaluations(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchApplication = async () => {
    try {
      const response = await fetch(
        `/api/v1/organizer/auditions/${auditionId}/applications/${applicationId}`,
        { credentials: 'include' }
      )
      if (response.ok) {
        const data = await response.json()
        setApplication(data.application)
      }
    } catch (error) {
      console.error('Failed to fetch application:', error)
    }
  }

  const fetchSteps = async () => {
    try {
      const response = await fetch(`/api/v1/organizer/auditions/${auditionId}/steps`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setSteps(data.steps || [])
      }
    } catch (error) {
      console.error('Failed to fetch steps:', error)
    }
  }

  const fetchEvaluations = async () => {
    try {
      const response = await fetch(
        `/api/v1/organizer/auditions/${auditionId}/applications/${applicationId}/evaluations`,
        { credentials: 'include' }
      )
      if (response.ok) {
        const data = await response.json()
        setEvaluations(data.evaluations || [])
      }
    } catch (error) {
      console.error('Failed to fetch evaluations:', error)
    }
  }

  const handleCreateEvaluation = async (stepId: string) => {
    if (!evaluationForm.result || evaluationForm.result === 'pending') {
      alert('合否判定を選択してください')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(
        `/api/v1/organizer/auditions/${auditionId}/applications/${applicationId}/steps/${stepId}/evaluation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            score: evaluationForm.score ? parseFloat(evaluationForm.score) : undefined,
            comments: evaluationForm.comments || undefined,
            result: evaluationForm.result,
          }),
        }
      )

      if (response.ok) {
        setEvaluationForm({ score: '', comments: '', result: 'pending' })
        setEvaluatingStepId(null)
        await fetchEvaluations()
        alert('評価を登録しました')
      } else {
        const error = await response.json()
        alert(error.error || '評価の登録に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create evaluation:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateApplicationStatus = async (newStatus: string, newStepId?: string) => {
    try {
      const response = await fetch(
        `/api/v1/organizer/auditions/${auditionId}/applications/${applicationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            overallStatus: newStatus,
            currentStepId: newStepId,
          }),
        }
      )

      if (response.ok) {
        await fetchApplication()
        alert('ステータスを更新しました')
      } else {
        const error = await response.json()
        alert(error.error || 'ステータスの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('ネットワークエラーが発生しました')
    }
  }

  const moveToNextStep = async () => {
    if (!application?.currentStepId) return
    
    const currentStep = steps.find(s => s.id === application.currentStepId)
    if (!currentStep) return

    const nextStep = steps.find(s => s.stepOrder === currentStep.stepOrder + 1)
    if (!nextStep) {
      alert('これが最終ステップです')
      return
    }

    if (confirm(`次のステップ「${nextStep.title}」に進めますか？`)) {
      await handleUpdateApplicationStatus('in_progress', nextStep.id)
    }
  }

  const getEvaluationForStep = (stepId: string) => {
    return evaluations.find(e => e.stepId === stepId)
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
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getResultBadge = (result: string) => {
    const badges = {
      pending: 'bg-gray-100 text-gray-700',
      passed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    const labels = {
      pending: '未評価',
      passed: '合格',
      rejected: '不合格',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badges[result as keyof typeof badges]}`}>
        {labels[result as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-red-500">応募情報が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link
          href={`/organizer/auditions/${auditionId}/applications`}
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← 応募者一覧に戻る
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              応募詳細・評価
            </h1>
            <p className="text-gray-600 mt-1">
              {application.talentName || 'タレント'} の応募
            </p>
          </div>
          {getStatusBadge(application.overallStatus)}
        </div>
      </div>

      {/* 応募情報 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">応募情報</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">応募日時</dt>
            <dd className="text-sm text-gray-900 mt-1">
              {new Date(application.appliedAt).toLocaleString('ja-JP')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">現在のステップ</dt>
            <dd className="text-sm text-gray-900 mt-1">
              {application.currentStep 
                ? `${application.currentStep.stepOrder}. ${application.currentStep.title}`
                : '未設定'}
            </dd>
          </div>
        </dl>
      </div>

      {/* ステップ別評価 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ステップ別評価</h2>
        
        {steps.length === 0 ? (
          <p className="text-gray-500 text-sm">ステップが設定されていません</p>
        ) : (
          <div className="space-y-4">
            {steps.map((step) => {
              const evaluation = getEvaluationForStep(step.id)
              const isCurrentStep = application.currentStepId === step.id
              const isEvaluating = evaluatingStepId === step.id

              return (
                <div
                  key={step.id}
                  className={`border rounded-lg p-4 ${
                    isCurrentStep ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {step.stepOrder}. {step.title}
                        {isCurrentStep && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            現在
                          </span>
                        )}
                      </h3>
                      {step.description && (
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      )}
                    </div>
                    {evaluation && getResultBadge(evaluation.result)}
                  </div>

                  {evaluation ? (
                    // 評価済み
                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      {evaluation.score !== undefined && (
                        <div className="text-sm">
                          <span className="text-gray-600">スコア:</span>
                          <span className="ml-2 font-medium">{evaluation.score}点</span>
                        </div>
                      )}
                      {evaluation.comments && (
                        <div className="text-sm">
                          <span className="text-gray-600">コメント:</span>
                          <p className="mt-1 text-gray-900">{evaluation.comments}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        評価日時: {evaluation.evaluatedAt 
                          ? new Date(evaluation.evaluatedAt).toLocaleString('ja-JP')
                          : '未設定'}
                      </div>
                    </div>
                  ) : isEvaluating ? (
                    // 評価フォーム
                    <div className="space-y-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          スコア（任意・0～100点）
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={evaluationForm.score}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, score: e.target.value })}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="0～100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          コメント（任意）
                        </label>
                        <textarea
                          value={evaluationForm.comments}
                          onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="評価コメントを入力"
                          maxLength={2000}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          合否判定 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setEvaluationForm({ ...evaluationForm, result: 'passed' })}
                            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                              evaluationForm.result === 'passed'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            合格
                          </button>
                          <button
                            type="button"
                            onClick={() => setEvaluationForm({ ...evaluationForm, result: 'rejected' })}
                            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                              evaluationForm.result === 'rejected'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            不合格
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateEvaluation(step.id)}
                          disabled={submitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitting ? '登録中...' : '評価を登録'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEvaluatingStepId(null)
                            setEvaluationForm({ score: '', comments: '', result: 'pending' })
                          }}
                          className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 未評価
                    <button
                      type="button"
                      onClick={() => setEvaluatingStepId(step.id)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                    >
                      このステップを評価する →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* アクション */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">ステータス操作</h2>
        <div className="flex flex-wrap gap-3">
          {application.currentStepId && (
            <button
              type="button"
              onClick={moveToNextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              次のステップに進める
            </button>
          )}
          <button
            type="button"
            onClick={() => handleUpdateApplicationStatus('passed')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            最終合格にする
          </button>
          <button
            type="button"
            onClick={() => handleUpdateApplicationStatus('rejected')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            不合格にする
          </button>
        </div>
      </div>
    </div>
  )
}
