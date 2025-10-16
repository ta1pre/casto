/**
 * オーディション編集ページ
 * [SF][CA] 既存データの編集
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Audition, AuditionGenre, AuditionArea } from '@casto/shared'
import type { MediaType } from '@casto/shared/types/media'
import { MediaUploader } from '@/shared/components/MediaUploader'
import { resolveApiUrl } from '@/shared/lib/api'

export default function EditAuditionPage({ params }: { params: Promise<{ id: string }> }) {
  const [auditionId, setAuditionId] = useState<string>('')
  const router = useRouter()
  const [audition, setAudition] = useState<Audition | null>(null)
  const [genres, setGenres] = useState<AuditionGenre[]>([])
  const [areas, setAreas] = useState<AuditionArea[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    projectType: 'audition' as 'audition' | 'job',
    genreIds: [] as string[],
    areaId: '',
  })
  const [mainVisualUrl, setMainVisualUrl] = useState<string | null>(null)
  const [mainVisualType, setMainVisualType] = useState<MediaType | null>(null)
  const [mediaUploading, setMediaUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    params.then(({ id }) => {
      setAuditionId(id)
      fetchAudition(id)
      fetchGenres()
      fetchAreas()
    })
  }, [params])

  const fetchAudition = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/organizer/auditions/${id}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        const aud = data.audition
        setAudition(aud)
        
        // フォームデータに変換
        setFormData({
          title: aud.title || '',
          description: aud.description || '',
          requirements: aud.requirements || '',
          shortDescription: aud.shortDescription || '',
          coverImageUrl: aud.coverImageUrl || '',
          coverImageAlt: aud.coverImageAlt || '',
          applicationStartDate: aud.applicationStartDate
            ? new Date(aud.applicationStartDate).toISOString().slice(0, 16)
            : '',
          applicationEndDate: aud.applicationEndDate
            ? new Date(aud.applicationEndDate).toISOString().slice(0, 16)
            : '',
          maxApplicants: aud.maxApplicants ? String(aud.maxApplicants) : '',
          projectType: aud.projectType || 'audition',
          genreIds: aud.genres?.map((g: AuditionGenre) => g.id) || [],
          areaId: aud.area?.id || '',
        })
        setMainVisualUrl(aud.mainVisualUrl || null)
        setMainVisualType(aud.mainVisualType || null)
      } else {
        router.push('/organizer/auditions')
      }
    } catch (error) {
      console.error('Failed to fetch audition:', error)
      router.push('/organizer/auditions')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)

    try {
      const payload = {
        ...formData,
        applicationStartDate: new Date(formData.applicationStartDate).toISOString(),
        applicationEndDate: new Date(formData.applicationEndDate).toISOString(),
        maxApplicants: formData.maxApplicants ? parseInt(formData.maxApplicants) : undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        coverImageAlt: formData.coverImageAlt || undefined,
        shortDescription: formData.shortDescription || undefined,
      }

      const response = await fetch(`/api/v1/organizer/auditions/${auditionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/organizer/auditions/${auditionId}`)
      } else {
        if (data.errors) {
          const errorMap: Record<string, string> = {}
          data.errors.forEach((err: { path?: string[]; message: string }) => {
            errorMap[err.path?.[0] || 'general'] = err.message
          })
          setErrors(errorMap)
        } else {
          setErrors({ general: data.details || data.error || '更新に失敗しました' })
        }
      }
    } catch (error) {
      console.error('Failed to update audition:', error)
      setErrors({ general: 'ネットワークエラーが発生しました' })
    } finally {
      setSaving(false)
    }
  }

  const toggleGenre = (genreId: string) => {
    setFormData((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }))
  }

  const selectArea = (areaId: string) => {
    setFormData((prev) => ({
      ...prev,
      areaId: areaId,
    }))
  }

  const handleMainVisualUpload = async (file: File) => {
    setMediaUploading(true)
    try {
      const formDataPayload = new FormData()
      formDataPayload.append('file', file)

      const response = await fetch(
        resolveApiUrl(`/api/v1/organizer/auditions/${auditionId}/main-visual/upload`),
        {
          method: 'POST',
          credentials: 'include',
          body: formDataPayload,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アップロードに失敗しました')
      }

      const data = await response.json()
      setMainVisualUrl(data.url)
      setMainVisualType(data.mediaType)
    } finally {
      setMediaUploading(false)
    }
  }

  const handleMainVisualDelete = async () => {
    setMediaUploading(true)
    try {
      const response = await fetch(
        resolveApiUrl(`/api/v1/organizer/auditions/${auditionId}/main-visual`),
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      setMainVisualUrl(null)
      setMainVisualType(null)
    } finally {
      setMediaUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">オーディション編集</h1>
        <p className="text-gray-500 mt-1">{audition.title}</p>
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
                      setFormData({ ...formData, projectType: e.target.value as 'audition' | 'job' })
                    }
                    className="mr-2"
                  />
                  求人
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

            {/* メインビジュアル */}
            <div>
              <MediaUploader
                mediaUrl={mainVisualUrl}
                mediaType={mainVisualType}
                onUpload={handleMainVisualUpload}
                onDelete={handleMainVisualDelete}
                disabled={mediaUploading || saving}
              />
            </div>
          </div>
        </div>

        {/* ジャンル */}
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

        {/* 実施エリア */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">実施エリア</h2>
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

        {/* アクションボタン */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push(`/organizer/auditions/${auditionId}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
            disabled={saving}
          >
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
