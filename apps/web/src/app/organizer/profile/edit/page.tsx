'use client'

/**
 * 主催者プロフィール編集ページ
 * [SF][CA] プロフィール編集フォーム
 */

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useOrganizerProfile } from '../../_hooks/useOrganizerProfile'
import { OrganizerProfileForm } from '../_components/OrganizerProfileForm'
import type { OrganizerProfileUpsertRequest } from '@casto/shared'

export default function OrganizerProfileEditPage() {
  const router = useRouter()
  const { profile, isLoading, updateProfile } = useOrganizerProfile()
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (data: OrganizerProfileUpsertRequest) => {
    try {
      await updateProfile(data)
      setSuccessMessage('プロフィールを保存しました')
      setTimeout(() => {
        router.push('/organizer/profile')
      }, 1500)
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile ? 'プロフィール編集' : 'プロフィール作成'}
          </h1>
          <button
            onClick={() => router.push('/organizer/profile')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            キャンセル
          </button>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* フォーム */}
        <OrganizerProfileForm
          profile={profile}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
