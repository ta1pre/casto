'use client'

/**
 * 写真アップロードステップ
 * 
 * [SF][REH] 最大6枚の写真をアップロード
 */

import { PhotoUploader } from '../ui/PhotoUploader'
import { PHOTO_CONFIG } from '../constants'
import type { ProfileFormData } from '../types'
import { useState } from 'react'

interface PhotoStepProps {
  formData: ProfileFormData
  onChange: (field: keyof ProfileFormData, value: any) => void
}

export function PhotoStep({ formData, onChange }: PhotoStepProps) {
  const [loading, setLoading] = useState(false)

  const handleUpload = async (index: number, file: File) => {
    setLoading(true)
    try {
      // FormDataを作成
      const formDataPayload = new FormData()
      formDataPayload.append('file', file)
      formDataPayload.append('index', index.toString())

      // APIにアップロード
      const response = await fetch('/api/v1/liff/profile/photos/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataPayload,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アップロードに失敗しました')
      }

      const data = await response.json()
      
      // photo_urlsを更新
      onChange('photoUrls', data.photoUrls || [])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (index: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/liff/profile/photos/${index}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      const data = await response.json()
      
      // photo_urlsを更新
      onChange('photoUrls', data.photoUrls || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: PHOTO_CONFIG.MAX_FILES }).map((_, index) => (
          <PhotoUploader
            key={index}
            index={index}
            label={PHOTO_CONFIG.PHOTO_LABELS[index]}
            photoUrl={formData.photoUrls?.[index]}
            onUpload={handleUpload}
            onDelete={handleDelete}
            disabled={loading}
          />
        ))}
      </div>

      {/* 必須項目の注意書き */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 顔写真と全身写真は必須です。その他の写真は任意でアップロードできます。
        </p>
      </div>
    </div>
  )
}
