/**
 * Admin オーディション新規作成ページ
 * [SF][CA] フォームバリデーション付き
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AuditionGenre, AuditionArea, AuditionStatus } from '@casto/shared'
import type { MediaType } from '@casto/shared/types/media'
import { MediaUploader } from '@/shared/components/MediaUploader'
import { resolveApiUrl } from '@/shared/lib/api'
import { AuditionStepsSection } from '../../../organizer/auditions/[id]/edit/_components/AuditionStepsSection'

interface AdminDisplayLabel {
  id: string
  label: string
  description: string | null
}

export default function AdminNewAuditionPage() {
  const router = useRouter()
  const [genres, setGenres] = useState<AuditionGenre[]>([])
  const [areas, setAreas] = useState<AuditionArea[]>([])
  const [labels, setLabels] = useState<AdminDisplayLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [mainVisualFile, setMainVisualFile] = useState<File | null>(null)
  const [mainVisualPreview, setMainVisualPreview] = useState<{
    url: string
    type: MediaType
  } | null>(null)
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
    adminDisplayLabelId: '',
    // エキストラ専用フィールド
    meetingPlace: '',
    eventDates: [] as string[],
    duration: '',
    expectedHeadcount: '',
    // 求人専用フィールド
    workLocation: '',
    employmentType: '',
    salary: '',
    areaId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createdAudition, setCreatedAudition] = useState<{ id: string; status: AuditionStatus }>({ id: '', status: 'draft' })
  const [creationNotice, setCreationNotice] = useState<string | null>(null)

  useEffect(() => {
    fetchGenres()
    fetchAreas()
    fetchLabels()
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

  useEffect(() => {
    if (formData.projectType !== 'job') {
      setFormData((prev) => ({
        ...prev,
        workLocation: '',
        employmentType: '',
        salary: '',
      }))
    }
  }, [formData.projectType])

  // メインビジュアルプレビューのクリーンアップ [PA]
  useEffect(() => {
    return () => {
      if (mainVisualPreview?.url) {
        URL.revokeObjectURL(mainVisualPreview.url)
      }
    }
  }, [mainVisualPreview?.url])

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

  const fetchAreas = async () => {
    try {
      const response = await fetch('/api/v1/organizer/areas', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setAreas(data.areas || [])
      }
    } catch (error) {
      console.error('Failed to fetch areas:', error)
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await fetch('/api/v1/admin/labels/active', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setLabels(data.labels || [])
      }
    } catch (error) {
      console.error('Failed to fetch admin labels:', error)
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

  // メインビジュアル選択ハンドラ [SF]
  const handleMainVisualSelect = async (file: File) => {
    try {
      // プレビュー用のObject URL生成
      const objectUrl = URL.createObjectURL(file)
      const mediaType: MediaType = file.type.startsWith('video/') ? 'video' : 'image'
      
      setMainVisualFile(file)
      setMainVisualPreview({ url: objectUrl, type: mediaType })
    } catch (error) {
      console.error('ファイル選択エラー:', error)
      setErrors({ ...errors, mainVisual: 'ファイルの選択に失敗しました' })
    }
  }

  // メインビジュアル削除ハンドラ [SF]
  const handleMainVisualRemove = async () => {
    if (mainVisualPreview?.url) {
      URL.revokeObjectURL(mainVisualPreview.url)
    }
    setMainVisualFile(null)
    setMainVisualPreview(null)
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
          duration: formData.duration || undefined,
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
        adminDisplayLabelId: formData.adminDisplayLabelId || undefined,
        extraDetails,
        areaId: formData.areaId || undefined,
      }

      const response = await fetch('/api/v1/admin/auditions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // オーディション作成失敗時のエラーハンドリング
        if (data.errors) {
          const errorMap: Record<string, string> = {}
          data.errors.forEach((err: { path?: string[]; message: string }) => {
            errorMap[err.path?.[0] || 'general'] = err.message
          })
          setErrors(errorMap)
        } else {
          setErrors({ general: data.details || data.error || '作成に失敗しました' })
        }
        return
      }

      const auditionId = data.audition.id as string
      const auditionStatus = (data.audition.status || 'draft') as AuditionStatus
      setCreatedAudition({ id: auditionId, status: auditionStatus })

      // Step 2: メインビジュアルアップロード（ファイルがある場合のみ） [REH]
      let uploadSucceeded = true
      if (mainVisualFile) {
        setMediaUploading(true)
        try {
          const formDataPayload = new FormData()
          formDataPayload.append('file', mainVisualFile)

          const uploadResponse = await fetch(
            resolveApiUrl(`/api/v1/organizer/auditions/${auditionId}/main-visual/upload`),
            {
              method: 'POST',
              credentials: 'include',
              body: formDataPayload,
            }
          )

          if (!uploadResponse.ok) {
            console.error('メインビジュアルのアップロードに失敗しました')
            uploadSucceeded = false
            const errorData = await uploadResponse.json()
            setErrors({
              general:
                errorData?.error ||
                'オーディションは作成されましたが、メインビジュアルのアップロードに失敗しました。編集画面から再度設定してください。',
            })
          } else {
            const uploaded = await uploadResponse.json()
            setMainVisualPreview({ url: uploaded.url, type: uploaded.mediaType })
          }
        } catch (uploadError) {
          console.error('メインビジュアルアップロードエラー:', uploadError)
          uploadSucceeded = false
          setErrors({
            general:
              'オーディションは作成されましたが、メインビジュアルのアップロードに失敗しました。編集画面から再度設定してください。',
          })
        } finally {
          setMediaUploading(false)
        }
      }

      if (uploadSucceeded) {
        setCreationNotice('下書きとして作成しました。続けて募集フロー（選考ステップ）を設定できます。')
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

  const selectArea = (areaId: string) => {
    setFormData((prev) => ({
      ...prev,
      areaId,
    }))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin オーディション新規作成</h1>
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

            {/* Admin表示ラベル */}
            <div>
              <label htmlFor="adminDisplayLabelId" className="block text-sm font-medium text-gray-700 mb-2">
                表示ラベル <span className="text-red-500">*</span>
              </label>
              <select
                id="adminDisplayLabelId"
                value={formData.adminDisplayLabelId}
                onChange={(e) => setFormData({ ...formData, adminDisplayLabelId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">表示ラベルを選択してください</option>
                {labels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.label}
                    {label.description && ` - ${label.description}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Admin代理公開では表示ラベルの選択が必須です。タレント向け画面でこのラベルが主催者情報として表示されます。
              </p>
              {errors.adminDisplayLabelId && (
                <p className="text-red-500 text-sm mt-1">{errors.adminDisplayLabelId}</p>
              )}
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
                placeholder="募集タイトルを入力して下さい。"
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
                placeholder="詳しい内容を入力してください"
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

            {/* メインビジュアル */}
            <div>
              <MediaUploader
                mediaUrl={mainVisualPreview?.url || null}
                mediaType={mainVisualPreview?.type || null}
                onUpload={handleMainVisualSelect}
                onDelete={handleMainVisualRemove}
                disabled={loading || mediaUploading}
              />
              {errors.mainVisual && (
                <p className="text-red-500 text-sm mt-1">{errors.mainVisual}</p>
              )}
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

              {/* 実施日時 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  実施日時(集合時間)
                </label>
                <div className="space-y-2">
                  {formData.eventDates.map((date, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => handleEventDateChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {formData.eventDates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEventDate(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEventDate}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    + 日時を追加
                  </button>
                </div>
              </div>

              {/* 所要時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所要時間
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 3時間、終日、2日間"
                />
              </div>
            </div>
          </div>
        )}

        {/* 募集エリア */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">募集エリア</h2>
          {areas.length === 0 ? (
            <p className="text-sm text-gray-500">エリア情報を読み込み中です...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {areas.map((area) => (
                <label
                  key={area.id}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                    formData.areaId === area.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="areaId"
                    value={area.id}
                    checked={formData.areaId === area.id}
                    onChange={() => selectArea(area.id)}
                    className="sr-only"
                  />
                  {area.name}
                </label>
              ))}
            </div>
          )}
        </div>

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

        {/* 求人情報（任意） */}
        {formData.projectType === 'job' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">求人情報（任意）</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">勤務地</label>
                <input
                  type="text"
                  value={formData.workLocation}
                  onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 東京都渋谷区"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">雇用形態</label>
                <input
                  type="text"
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="例: 正社員、契約社員、アルバイト"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">給与</label>
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
        ) : null}

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
            disabled={loading || !!createdAudition.id}
          >
            {createdAudition.id ? '作成済み' : loading ? '作成中...' : '下書きとして作成'}
          </button>
        </div>
      </form>

      {createdAudition.id && (
        <div className="mt-8 space-y-6">
          {creationNotice && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg">
              <p className="font-medium">{creationNotice}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin/auditions')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  オーディション一覧に戻る
                </button>
              </div>
            </div>
          )}

          <AuditionStepsSection
            auditionId={createdAudition.id}
            isPublished={createdAudition.status === 'published'}
          />
        </div>
      )}
    </div>
  )
}
