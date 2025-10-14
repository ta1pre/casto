'use client'

/**
 * 主催者プロフィールフォーム
 * [SF][CA][RP] プロフィール編集フォーム
 */

import { useState, useEffect } from 'react'
import type { OrganizerProfile, OrganizerProfileUpsertRequest } from '@casto/shared'
import { validateOrganizerProfile } from '@casto/shared/validators'

interface OrganizerProfileFormProps {
  profile: OrganizerProfile | null
  onSubmit: (data: OrganizerProfileUpsertRequest) => Promise<void>
  isLoading?: boolean
}

export function OrganizerProfileForm({
  profile,
  onSubmit,
  isLoading = false,
}: OrganizerProfileFormProps) {
  const [formData, setFormData] = useState<OrganizerProfileUpsertRequest>({
    name: '',
    address: '',
    phone: '',
    description: '',
    contactPerson: '',
    email: '',
    website: '',
    instagramUrl: '',
    xUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
    logoUrl: '',
    isActive: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        address: profile.address,
        phone: profile.phone,
        description: profile.description,
        contactPerson: profile.contactPerson ?? '',
        email: profile.email ?? '',
        website: profile.website ?? '',
        instagramUrl: profile.instagramUrl ?? '',
        xUrl: profile.xUrl ?? '',
        tiktokUrl: profile.tiktokUrl ?? '',
        youtubeUrl: profile.youtubeUrl ?? '',
        logoUrl: profile.logoUrl ?? '',
        isActive: profile.isActive,
      })
    }
  }, [profile])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    const validation = validateOrganizerProfile(formData)
    if (!validation.valid) {
      const newErrors: Record<string, string> = {}
      validation.errors.forEach((error) => {
        newErrors[error.field] = error.message
      })
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to submit profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClassName =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent'
  const labelClassName = 'block text-sm font-medium text-gray-700 mb-1'
  const errorClassName = 'text-sm text-red-600 mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 基本情報</h2>

        <div className="space-y-4">
          {/* 団体名 */}
          <div>
            <label htmlFor="name" className={labelClassName}>
              団体名 / 社名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClassName}
              required
            />
            {errors.name && <p className={errorClassName}>{errors.name}</p>}
          </div>

          {/* 担当者名 */}
          <div>
            <label htmlFor="contactPerson" className={labelClassName}>
              担当者名
            </label>
            <input
              type="text"
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson ?? ''}
              onChange={handleChange}
              className={inputClassName}
            />
            {errors.contactPerson && (
              <p className={errorClassName}>{errors.contactPerson}</p>
            )}
          </div>

          {/* 住所 */}
          <div>
            <label htmlFor="address" className={labelClassName}>
              住所 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={inputClassName}
              placeholder="都道府県＋市区町村まででOK"
              required
            />
            {errors.address && <p className={errorClassName}>{errors.address}</p>}
          </div>

          {/* 電話番号 */}
          <div>
            <label htmlFor="phone" className={labelClassName}>
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClassName}
              placeholder="03-1234-5678"
              required
            />
            {errors.phone && <p className={errorClassName}>{errors.phone}</p>}
          </div>

          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className={labelClassName}>
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email ?? ''}
              onChange={handleChange}
              className={inputClassName}
            />
            {errors.email && <p className={errorClassName}>{errors.email}</p>}
          </div>

          {/* 公式サイト */}
          <div>
            <label htmlFor="website" className={labelClassName}>
              公式サイト
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website ?? ''}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://example.com"
            />
            {errors.website && <p className={errorClassName}>{errors.website}</p>}
          </div>

          {/* 団体概要 */}
          <div>
            <label htmlFor="description" className={labelClassName}>
              団体概要 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className={inputClassName}
              placeholder="活動内容・理念・実績など（50〜1000文字）"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length} / 1000文字
            </p>
            {errors.description && (
              <p className={errorClassName}>{errors.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* SNSリンク */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📱 SNSリンク</h2>

        <div className="space-y-4">
          {/* Instagram */}
          <div>
            <label htmlFor="instagramUrl" className={labelClassName}>
              Instagram
            </label>
            <input
              type="url"
              id="instagramUrl"
              name="instagramUrl"
              value={formData.instagramUrl ?? ''}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://instagram.com/..."
            />
            {errors.instagramUrl && (
              <p className={errorClassName}>{errors.instagramUrl}</p>
            )}
          </div>

          {/* X (Twitter) */}
          <div>
            <label htmlFor="xUrl" className={labelClassName}>
              X (Twitter)
            </label>
            <input
              type="url"
              id="xUrl"
              name="xUrl"
              value={formData.xUrl ?? ''}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://x.com/..."
            />
            {errors.xUrl && <p className={errorClassName}>{errors.xUrl}</p>}
          </div>

          {/* TikTok */}
          <div>
            <label htmlFor="tiktokUrl" className={labelClassName}>
              TikTok
            </label>
            <input
              type="url"
              id="tiktokUrl"
              name="tiktokUrl"
              value={formData.tiktokUrl ?? ''}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://tiktok.com/@..."
            />
            {errors.tiktokUrl && (
              <p className={errorClassName}>{errors.tiktokUrl}</p>
            )}
          </div>

          {/* YouTube */}
          <div>
            <label htmlFor="youtubeUrl" className={labelClassName}>
              YouTube
            </label>
            <input
              type="url"
              id="youtubeUrl"
              name="youtubeUrl"
              value={formData.youtubeUrl ?? ''}
              onChange={handleChange}
              className={inputClassName}
              placeholder="https://youtube.com/@..."
            />
            {errors.youtubeUrl && (
              <p className={errorClassName}>{errors.youtubeUrl}</p>
            )}
          </div>
        </div>
      </div>

      {/* 公開設定 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🧩 公開設定</h2>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            プロフィールを公開する
          </label>
        </div>
      </div>

      {/* 送信ボタン */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting || isLoading ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  )
}
