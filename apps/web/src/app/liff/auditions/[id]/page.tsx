'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useLiffAuth } from '@/hooks/useLiffAuth'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ErrorScreen } from '@/components/ErrorScreen'
import { apiFetch } from '@/utils/api'

interface Audition {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  organizerName: string
  organizerId: string
  deadline: string
  applicationStartDate: string
  status: 'draft' | 'published' | 'closed'
  requirements?: string
  prizes?: string
  contactInfo?: string
}

export default function AuditionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, isLoading, error } = useLiffAuth()
  const [audition, setAudition] = useState<Audition | null>(null)
  const [isLoadingAudition, setIsLoadingAudition] = useState(true)
  const [auditionError, setAuditionError] = useState<string | null>(null)

  // オーディション情報の取得
  useEffect(() => {
    const fetchAudition = async () => {
      if (!user) return

      try {
        setIsLoadingAudition(true)
        setAuditionError(null)

        // TODO: 実際のAPI実装後に置き換え
        const response = await apiFetch<{ audition: Audition }>(
          `/api/v1/auditions/${params.id}`
        )
        
        setAudition(response.audition)

        // 閲覧履歴に保存（localStorage）
        saveToRecentAuditions(response.audition)

        // DB保存（非同期・バックグラウンド）
        saveToHistory(params.id).catch(err => {
          console.error('Failed to save history:', err)
        })
      } catch (err: any) {
        console.error('Failed to fetch audition:', err)
        
        // 404の場合はトップページにリダイレクト
        if (err.status === 404) {
          setAuditionError('オーディションが見つかりませんでした')
          setTimeout(() => {
            router.push('/liff')
          }, 2000)
        } else {
          setAuditionError('オーディション情報の取得に失敗しました')
        }
      } finally {
        setIsLoadingAudition(false)
      }
    }

    if (user) {
      void fetchAudition()
    }
  }, [user, params.id, router])

  // localStorageに閲覧履歴を保存
  const saveToRecentAuditions = (audition: Audition) => {
    try {
      const recent = localStorage.getItem('recentAuditions')
      let auditions: any[] = recent ? JSON.parse(recent) : []

      // 既存のものは削除
      auditions = auditions.filter(a => a.id !== audition.id)

      // 先頭に追加
      auditions.unshift({
        id: audition.id,
        title: audition.title,
        thumbnailUrl: audition.thumbnailUrl,
        organizerName: audition.organizerName,
        deadline: audition.deadline,
        viewedAt: new Date().toISOString()
      })

      // 最大10件まで保存
      auditions = auditions.slice(0, 10)

      localStorage.setItem('recentAuditions', JSON.stringify(auditions))
    } catch (e) {
      console.error('Failed to save to recent auditions:', e)
    }
  }

  // DBに閲覧履歴を保存（非同期）
  const saveToHistory = async (auditionId: string) => {
    try {
      await apiFetch('/api/v1/users/me/history', {
        method: 'POST',
        body: JSON.stringify({
          auditionId,
          action: 'view'
        })
      })
    } catch (err) {
      // エラーは無視（バックグラウンド保存）
      console.warn('Failed to save history to DB:', err)
    }
  }

  if (isLoading || isLoadingAudition) {
    return <LoadingScreen message="読み込み中..." />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  if (!user) {
    return <ErrorScreen message="認証に失敗しました" />
  }

  if (auditionError) {
    return (
      <ErrorScreen 
        message={auditionError}
        onRetry={() => router.push('/liff')}
      />
    )
  }

  if (!audition) {
    return <LoadingScreen message="オーディション情報を取得中..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/liff')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-bold text-gray-900">casto</h1>
          <div className="w-12"></div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* サムネイル */}
        {audition.thumbnailUrl ? (
          <Image
            src={audition.thumbnailUrl}
            alt={audition.title}
            width={800}
            height={400}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg mb-6">
            <span className="text-6xl">🎭</span>
          </div>
        )}

        {/* タイトルと主催者 */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {audition.title}
          </h2>
          <p className="text-gray-600 mb-4">
            主催: {audition.organizerName}
          </p>

          {/* 締切情報 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">応募期間:</span>
              <span className="font-medium">
                {new Date(audition.applicationStartDate).toLocaleDateString('ja-JP')}
                {' 〜 '}
                {new Date(audition.deadline).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        </div>

        {/* 説明 */}
        <div className="bg-white rounded-lg p-6 mb-4">
          <h3 className="font-bold text-lg mb-3">オーディション概要</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {audition.description}
          </p>
        </div>

        {/* 応募条件 */}
        {audition.requirements && (
          <div className="bg-white rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg mb-3">応募条件</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {audition.requirements}
            </p>
          </div>
        )}

        {/* 賞金・特典 */}
        {audition.prizes && (
          <div className="bg-white rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg mb-3">賞金・特典</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {audition.prizes}
            </p>
          </div>
        )}

        {/* お問い合わせ */}
        {audition.contactInfo && (
          <div className="bg-white rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg mb-3">お問い合わせ</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {audition.contactInfo}
            </p>
          </div>
        )}

        {/* 応募ボタン */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-7xl mx-auto">
            {audition.status === 'published' ? (
              <Link href={`/liff/auditions/${audition.id}/apply`}>
                <button className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 transition">
                  今すぐ応募する
                </button>
              </Link>
            ) : (
              <button 
                disabled 
                className="w-full bg-gray-300 text-gray-500 py-4 rounded-lg font-bold cursor-not-allowed"
              >
                {audition.status === 'closed' ? '応募受付終了' : '準備中'}
              </button>
            )}
          </div>
        </div>

        {/* 下部スペース（固定ボタンの高さ分） */}
        <div className="h-20"></div>
      </main>
    </div>
  )
}
