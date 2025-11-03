/**
 * オーディション新規作成ページ
 * [SF][CA] フォームバリデーション付き
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AuditionGenre } from '@casto/shared'

export default function NewAuditionPage() {
  const router = useRouter()
  const [genres, setGenres] = useState<AuditionGenre[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    shortDescription: '',
    coverImageUrl: '',
    coverImageAlt: '',
    applicationStartDate: '',
    applicationEndDate: '',
    maxApplicants: '',
    projectType: 'audition' as 'audition' | 'job' | 'extra',
    genreIds: [] as string[],
    // エキストラ専用フィールド
    meetingPlace: '',
    eventDates: [] as string[],
    expectedHeadcount: '',
    // 求人専用フィールド
    workLocation: '',
    employmentType: '',
    salary: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchGenres()
    // デフォルトの日時を設定
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextMonth = new Date(now)
    const nextMonthISO = nextMonth.toISOString().slice(0, 16)

    setFormData((prev) => ({
      ...prev,
      applicationStartDate: now.toISOString().slice(0, 16),
      applicationEndDate: nextMonthISO,
      eventDates: prev.eventDates.length > 0 ? prev.eventDates : [''],
    }))
  }, [])

  useEffect(() => {
    if (formData.projectType !== 'audition' && formData.genreIds.length > 0) {
      setFormData((prev) => ({
        ...prev,
        genreIds: [],
      }))
    }
  }, [formData.projectType, formData.genreIds.length])

  useEffect(() => {
    if (formData.projectType === 'extra' && formData.eventDates.length === 0) {
      setFormData((prev) => ({
        ...prev,
        eventDates: [''],
      }))
    }
    if (formData.projectType !== 'extra' && formData.eventDates.length > 0) {
      setFormData((prev) => ({
        ...prev,
        eventDates: [],
      }))
    }
  }, [formData.projectType, formData.eventDates.length])

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/v1/organizer/genres', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setGenres(data.genres || [])
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error)
    }
  }

  const handleEventDateChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.eventDates]
      updated[index] = value
      return {
        ...prev,
        eventDates: updated,
      }
    })
  }

  const addEventDate = () => {
    setFormData((prev) => ({
      ...prev,
      eventDates: [...prev.eventDates, ''],
    }))
  }

  const removeEventDate = (index: number) => {
    setFormData((prev) => {
      const updated = prev.eventDates.filter((_, i) => i !== index)
      return {
        ...prev,
        eventDates: updated.length > 0 ? updated : [''],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // extraDetailsを種別に応じて構築
      let extraDetails: Record<string, unknown> | undefined = undefined
      if (formData.projectType === 'extra') {
        extraDetails = {
          meetingPlace: formData.meetingPlace || undefined,
          eventDates: formData.eventDates.length > 0 ? formData.eventDates : undefined,
          expectedHeadcount: formData.expectedHeadcount ? parseInt(formData.expectedHeadcount) : undefined,
        }
      } else if (formData.projectType === 'job') {
        extraDetails = {
          workLocation: formData.workLocation || undefined,
          employmentType: formData.employmentType || undefined,
          salary: formData.salary || undefined,
        }
      }

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        requirements: formData.requirements || undefined,
        shortDescription: formData.shortDescription || undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        coverImageAlt: formData.coverImageAlt || undefined,
        applicationStartDate: new Date(formData.applicationStartDate).toISOString(),
        applicationEndDate: new Date(formData.applicationEndDate).toISOString(),
        maxApplicants: formData.maxApplicants ? parseInt(formData.maxApplicants) : undefined,
        projectType: formData.projectType,
        genreIds:
          formData.projectType === 'audition' && formData.genreIds.length > 0
            ? formData.genreIds
            : undefined,
        extraDetails,
      }

      const response = await fetch('/api/v1/organizer/auditions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/organizer/auditions/${data.audition.id}`)
      } else {
        if (data.errors) {
          const errorMap: Record<string, string> = {}
          data.errors.forEach((err: { path?: string[]; message: string }) => {
            errorMap[err.path?.[0] || 'general'] = err.message
          })
          setErrors(errorMap)
        } else {
          setErrors({ general: data.details || data.error || '作成に失敗しました' })
        }
      }
    } catch (error) {
      console.error('Failed to create audition:', error)
      setErrors({ general: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const toggleGenre = (genreId: string) => {
    setFormData((prev) => {
      const isSelected = prev.genreIds.includes(genreId)
      const nextIds = isSelected
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId]

      return {
        ...prev,
        genreIds: nextIds,
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">オーディション新規作成</h1>
        <p className="text-gray-500 mt-1">新しいオーディション・求人を作成します</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>

          <div className="space-y-4">
            {/* プロジェクトタイプ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                種別 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="audition"
                    checked={formData.projectType === 'audition'}
                    onChange={(e) =>
                      setFormData({ ...formData, projectType: e.target.value as 'audition' | 'job' })
                    }
                    className="mr-2"
                  />
                  オーディション
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="job"
                    checked={formData.projectType === 'job'}
                    onChange={(e) =>
                      setFormData({ ...formData, projectType: e.target.value as 'audition' | 'job' | 'extra' })
                    }
                    className="mr-2"
                  />
                  求人
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="extra"
                    checked={formData.projectType === 'extra'}
                    onChange={(e) =>
                      setFormData({ ...formData, projectType: e.target.value as 'audition' | 'job' | 'extra' })
                    }
                    className="mr-2"
                  />
                  エキストラ募集
                </label>
              </div>
            </div>

            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="例: 新人アイドルオーディション2025"
                required
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* 短い説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                短い説明（SNS向け）
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="100文字以内"
                maxLength={100}
              />
              <p className="text-gray-500 text-xs mt-1">{formData.shortDescription.length}/100</p>
            </div>

            {/* 詳細説明 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">詳細説明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="オーディションの詳細を入力してください"
              />
            </div>

            {/* 応募条件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">応募条件</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="年齢、経験、スキルなど"
              />
            </div>
          </div>
        </div>

        {/* ジャンル（エキストラ以外） */}
        {formData.projectType !== 'extra' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ジャンル（最大3つ）</h2>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.genreIds.includes(genre.id)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                  }`}
                  disabled={!formData.genreIds.includes(genre.id) && formData.genreIds.length >= 3}
                >
                  {genre.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* エキストラ募集専用項目 */}
        {formData.projectType === 'extra' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">エキストラ募集情報</h2>
            <div className="space-y-4">
              {/* 集合場所 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  集合場所
                </label>
                <input
                  type="text"
                  value={formData.meetingPlace}
                  onChange={(e) => setFormData({ ...formData, meetingPlace: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 渋谷スタジオ"
                />
              </div>

              {/* 想定人数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  想定人数
                </label>
                <input
                  type="number"
                  value={formData.expectedHeadcount}
                  onChange={(e) => setFormData({ ...formData, expectedHeadcount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 20"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* 求人専用項目 */}
        {formData.projectType === 'job' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">求人情報</h2>
            <div className="space-y-4">
              {/* 勤務地 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  勤務地
                </label>
                <input
                  type="text"
                  value={formData.workLocation}
                  onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 東京都渋谷区"
                />
              </div>

              {/* 雇用形態 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  雇用形態
                </label>
                <input
                  type="text"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 正社員、契約社員、アルバイト"
                />
              </div>

              {/* 給与 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  給与
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 月給25万円〜"
                />
              </div>
            </div>
          </div>
        )}

        {/* 募集期間・定員 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">募集設定</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 募集開始日時 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                募集開始日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.applicationStartDate}
                onChange={(e) => setFormData({ ...formData, applicationStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            {/* 募集終了日時 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                募集終了日時 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.applicationEndDate}
                onChange={(e) => setFormData({ ...formData, applicationEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
              {errors.applicationEndDate && (
                <p className="text-red-500 text-sm mt-1">{errors.applicationEndDate}</p>
              )}
            </div>

            {/* 定員 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                定員（任意）
              </label>
              <input
                type="number"
                value={formData.maxApplicants}
                onChange={(e) => setFormData({ ...formData, maxApplicants: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="無制限の場合は空欄"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? '作成中...' : '下書きとして作成'}
          </button>
        </div>
      </form>
    </div>
  )
}
