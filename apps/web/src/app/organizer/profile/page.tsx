'use client'

/**
 * 主催者プロフィール表示ページ
 * [SF][CA] プロフィール表示・編集導線
 */

import { useRouter } from 'next/navigation'
import { useOrganizerProfile } from '../_hooks/useOrganizerProfile'

export default function OrganizerProfilePage() {
  const router = useRouter()
  const { profile, isLoading, error } = useOrganizerProfile()

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">エラーが発生しました</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            プロフィール未登録
          </h1>
          <p className="text-gray-600 mb-6">
            まだプロフィールが登録されていません。
            <br />
            プロフィールを作成してください。
          </p>
          <button
            onClick={() => router.push('/organizer/profile/edit')}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            プロフィールを作成
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
          <button
            onClick={() => router.push('/organizer/profile/edit')}
            className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            編集
          </button>
        </div>

        {/* 公開状態バッジ */}
        <div className="mb-6">
          {profile.isActive ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ 公開中
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              非公開
            </span>
          )}
        </div>

        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏢 基本情報</h2>
          <dl className="space-y-4">
            {profile.logoUrl && (
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">ロゴ</dt>
                <dd>
                  <div className="relative w-32 h-32 rounded-full border-2 border-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={profile.logoUrl}
                      alt="ロゴ"
                      className="absolute top-1/2 left-1/2 select-none"
                      style={{
                        transform: `translate(calc(-50% + ${profile.logoPositionX ?? 0}px), calc(-50% + ${profile.logoPositionY ?? 0}px)) scale(${profile.logoScale ?? 1})`,
                        maxWidth: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">団体名 / 社名</dt>
              <dd className="mt-1 text-lg text-gray-900">{profile.name}</dd>
            </div>

            {profile.contactPerson && (
              <div>
                <dt className="text-sm font-medium text-gray-500">担当者名</dt>
                <dd className="mt-1 text-gray-900">{profile.contactPerson}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">住所</dt>
              <dd className="mt-1 text-gray-900">
                {profile.prefecture} {profile.addressDetail}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">電話番号</dt>
              <dd className="mt-1 text-gray-900">{profile.phone}</dd>
            </div>

            {profile.email && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  メールアドレス
                </dt>
                <dd className="mt-1 text-gray-900">{profile.email}</dd>
              </div>
            )}

            {profile.website && (
              <div>
                <dt className="text-sm font-medium text-gray-500">公式サイト</dt>
                <dd className="mt-1">
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 underline"
                  >
                    {profile.website}
                  </a>
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500">団体概要</dt>
              <dd className="mt-1 text-gray-900 whitespace-pre-wrap">
                {profile.description}
              </dd>
            </div>
          </dl>
        </div>

        {/* SNSリンク */}
        {(profile.instagramUrl ||
          profile.xUrl ||
          profile.tiktokUrl ||
          profile.youtubeUrl) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📱 SNSリンク</h2>
            <div className="space-y-3">
              {profile.instagramUrl && (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-purple-600 hover:text-purple-700"
                >
                  <span className="font-medium">Instagram</span>
                  <span className="ml-2">→</span>
                </a>
              )}

              {profile.xUrl && (
                <a
                  href={profile.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-purple-600 hover:text-purple-700"
                >
                  <span className="font-medium">X (Twitter)</span>
                  <span className="ml-2">→</span>
                </a>
              )}

              {profile.tiktokUrl && (
                <a
                  href={profile.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-purple-600 hover:text-purple-700"
                >
                  <span className="font-medium">TikTok</span>
                  <span className="ml-2">→</span>
                </a>
              )}

              {profile.youtubeUrl && (
                <a
                  href={profile.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-purple-600 hover:text-purple-700"
                >
                  <span className="font-medium">YouTube</span>
                  <span className="ml-2">→</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
