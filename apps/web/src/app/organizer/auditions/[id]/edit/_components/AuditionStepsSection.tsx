/**
 * オーディションステップ設定セクション
 * [SF][CA] ステップの追加・編集・削除
 */

'use client'

import { useState, useEffect } from 'react'
import type { AuditionStep } from '@casto/shared'

interface AuditionStepsSectionProps {
  auditionId: string
  isPublished: boolean
}

export function AuditionStepsSection({ auditionId, isPublished }: AuditionStepsSectionProps) {
  const [steps, setSteps] = useState<AuditionStep[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStep, setEditingStep] = useState<AuditionStep | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (auditionId) {
      fetchSteps()
    }
  }, [auditionId])

  const fetchSteps = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizer/auditions/${auditionId}/steps`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSteps(data.steps || [])
      }
    } catch (error) {
      console.error('Failed to fetch steps:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('タイトルを入力してください')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/v1/organizer/auditions/${auditionId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
        }),
      })

      if (response.ok) {
        setFormData({ title: '', description: '' })
        setShowAddForm(false)
        await fetchSteps()
      } else {
        const error = await response.json()
        alert(error.error || 'ステップの作成に失敗しました')
      }
    } catch (error) {
      console.error('Failed to create step:', error)
      alert('ステップの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStep = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingStep || !formData.title.trim()) {
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(
        `/api/v1/organizer/auditions/${auditionId}/steps/${editingStep.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || undefined,
          }),
        }
      )

      if (response.ok) {
        setFormData({ title: '', description: '' })
        setEditingStep(null)
        await fetchSteps()
      } else {
        const error = await response.json()
        alert(error.error || 'ステップの更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update step:', error)
      alert('ステップの更新に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('このステップを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(
        `/api/v1/organizer/auditions/${auditionId}/steps/${stepId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (response.ok) {
        await fetchSteps()
      } else {
        const error = await response.json()
        alert(error.error || 'ステップの削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete step:', error)
      alert('ステップの削除に失敗しました')
    }
  }

  const startEdit = (step: AuditionStep) => {
    setEditingStep(step)
    setFormData({
      title: step.title,
      description: step.description || '',
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingStep(null)
    setFormData({ title: '', description: '' })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">選考ステップ設定</h2>
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">選考ステップ設定</h2>
        {isPublished && (
          <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
            公開済みのため編集不可
          </span>
        )}
      </div>

      {steps.length === 0 && !isPublished && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p className="text-sm text-blue-800">
            💡 オーディションを公開すると、「書類選考」ステップが自動的に作成されます。
          </p>
        </div>
      )}

      {/* ステップ一覧 */}
      <div className="space-y-3 mb-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
          >
            {editingStep?.id === step.id ? (
              // 編集フォーム
              <form onSubmit={handleUpdateStep} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ステップ名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 二次面接"
                    maxLength={100}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">説明（任意）</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="ステップの詳細を入力"
                    maxLength={1000}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            ) : (
              // 表示モード
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-lg">
                      {step.stepOrder}. {step.title}
                    </span>
                    {step.stepType === 'document_screening' && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        必須
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  )}
                </div>
                {!isPublished && step.stepType !== 'document_screening' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(step)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 新規追加フォーム */}
      {!isPublished && (
        <>
          {showAddForm ? (
            <form onSubmit={handleAddStep} className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  ステップ名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 二次面接、最終選考"
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">説明（任意）</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="ステップの詳細を入力"
                  maxLength={1000}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '追加中...' : 'ステップを追加'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormData({ title: '', description: '' })
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + ステップを追加
            </button>
          )}
        </>
      )}
    </div>
  )
}
