'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLiffAuth } from '@/hooks/useLiffAuth'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ErrorScreen } from '@/components/ErrorScreen'

interface Audition {
  id: string
  title: string
  thumbnailUrl?: string
  organizerName: string
  deadline: string
}

export default function LiffHomePage() {
  const { user, isLoading, error, liffProfile, logout } = useLiffAuth()
  const [recentAuditions, setRecentAuditions] = useState<Audition[]>([])
  const [popularAuditions, setPopularAuditions] = useState<Audition[]>([])

  // 最近見たオーディションの取得
  useEffect(() => {
    if (user) {
      // TODO: API実装後に置き換え
      const recent = localStorage.getItem('recentAuditions')
      if (recent) {
        try {
          setRecentAuditions(JSON.parse(recent))
        } catch (e) {
          console.error('Failed to parse recent auditions', e)
        }
      }
    }
  }, [user])

  if (isLoading) {
    return <LoadingScreen message="読み込み中..." />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  if (!user) {
    return <ErrorScreen message="認証に失敗しました" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">casto</h1>
          <div className="flex items-center gap-3">
            {liffProfile?.pictureUrl && (
              <Image
                src={liffProfile.pictureUrl}
                alt="プロフィール"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">
              {user.displayName ?? liffProfile?.displayName ?? 'ゲスト'}
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ウェルカムメッセージ */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            おかえりなさい！
          </h2>
          <p className="text-gray-600">
            気になるオーディションを探して応募しましょう
          </p>
        </section>

        {/* 最近見たオーディション */}
        {recentAuditions.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                最近見たオーディション
              </h3>
              <Link 
                href="/liff/history" 
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                すべて見る →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {recentAuditions.slice(0, 4).map((audition) => (
                <AuditionCard key={audition.id} audition={audition} />
              ))}
            </div>
          </section>
        )}

        {/* 人気のオーディション */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              人気のオーディション
            </h3>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-gray-500">
              まだオーディションがありません
            </p>
            <p className="text-sm text-gray-400 mt-2">
              オーディションが公開されるとここに表示されます
            </p>
          </div>
        </section>

        {/* カテゴリ */}
        <section className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            カテゴリから探す
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <CategoryCard title="アイドル" emoji="⭐" />
            <CategoryCard title="モデル" emoji="📸" />
            <CategoryCard title="俳優・女優" emoji="🎬" />
            <CategoryCard title="ダンサー" emoji="💃" />
          </div>
        </section>

        {/* デバッグ情報 */}
        {process.env.NODE_ENV === 'development' && (
          <section className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">デバッグ情報</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ user, liffProfile }, null, 2)}
            </pre>
            <button
              onClick={logout}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              ログアウト
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

// オーディションカードコンポーネント
function AuditionCard({ audition }: { audition: Audition }) {
  return (
    <Link href={`/liff/auditions/${audition.id}`}>
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
        {audition.thumbnailUrl ? (
          <Image
            src={audition.thumbnailUrl}
            alt={audition.title}
            width={200}
            height={150}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">🎭</span>
          </div>
        )}
        <div className="p-3">
          <h4 className="font-bold text-sm text-gray-900 mb-1 truncate">
            {audition.title}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {audition.organizerName}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            締切: {audition.deadline}
          </p>
        </div>
      </div>
    </Link>
  )
}

// カテゴリカードコンポーネント
function CategoryCard({ title, emoji }: { title: string; emoji: string }) {
  return (
    <div className="bg-white rounded-lg p-6 text-center hover:shadow-md transition cursor-pointer">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="font-bold text-gray-900">{title}</p>
    </div>
  )
}
