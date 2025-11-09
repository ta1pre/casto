'use client'

/**
 * LIFFオーディション詳細ページ
 * [SF][CA] Workers APIレスポンス形式に完全対応、メインビジュアル1:1表示
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft, CheckCircle } from 'lucide-react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { apiFetch, ApiError } from '@/shared/lib/api'
import { formatDateJa } from '@/shared/lib/date'
import type { Audition, AuditionStep } from '@casto/shared'
import { VideoThumbnail } from '@/shared/components/VideoThumbnail'

export default function AuditionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading, error } = useLiffAuth()
  const [audition, setAudition] = useState<Audition | null>(null)
  const [steps, setSteps] = useState<AuditionStep[]>([])
  const [isLoadingAudition, setIsLoadingAudition] = useState(true)
  const [auditionError, setAuditionError] = useState<string | null>(null)
  const [auditionId, setAuditionId] = useState<string | null>(null)

  // paramsの解決
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setAuditionId(resolvedParams.id)
    }
    void resolveParams()
  }, [params])

  // オーディション情報とステップの取得
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !auditionId) return

      try {
        setIsLoadingAudition(true)
        setAuditionError(null)

        // オーディション情報取得（ステップ情報も含まれる）
        const response = await apiFetch<{ audition: Audition }>(
          `/api/v1/talent/auditions/${auditionId}`
        )
        setAudition(response.audition)
        
        // ステップ情報をセット
        if (response.audition.steps) {
          setSteps(response.audition.steps)
        }
      } catch (err: unknown) {
        console.error('Failed to fetch audition:', err)

        if (err instanceof ApiError) {
          if (err.status === 404) {
            setAuditionError('オーディションが見つかりませんでした')
            setTimeout(() => {
              router.push('/liff/auditions')
            }, 2000)
          } else {
            setAuditionError('オーディション情報の取得に失敗しました')
          }
        } else {
          setAuditionError('オーディション情報の取得に失敗しました')
        }
      } finally {
        setIsLoadingAudition(false)
      }
    }

    if (user && auditionId) {
      void fetchData()
    }
  }, [user, auditionId, router])

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
        onRetry={() => router.push('/liff/auditions')}
      />
    )
  }

  if (!audition) {
    return <LoadingScreen message="オーディション情報を取得中..." />
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ヘッダー */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/liff/auditions" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground truncate">オーディション詳細</h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="px-4 py-6 space-y-4">
        {/* メインビジュアル（1:1） */}
        {audition.mainVisualUrl && (
          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {audition.mainVisualType === 'video' ? (
              <VideoThumbnail
                src={audition.mainVisualUrl}
                alt={audition.title}
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={audition.mainVisualUrl}
                alt={audition.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* 基本情報 */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          {audition.genres && audition.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {audition.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {genre.displayName}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {audition.title}
            </h2>
            {audition.shortDescription && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {audition.shortDescription}
              </p>
            )}
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                応募期間: {formatDateJa(audition.applicationStartDate)}
                {' 〜 '}
                {formatDateJa(audition.applicationEndDate)}
              </span>
            </div>

            {audition.area && (
              <div>
                <p className="text-xs font-semibold text-foreground/80 mb-1">実施エリア</p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {audition.area.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 詳細 */}
        {audition.description && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold text-foreground mb-3">詳細</h3>
            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {audition.description}
            </p>
          </div>
        )}

        {/* 応募条件 */}
        {audition.requirements && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold text-foreground mb-3">応募条件</h3>
            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {audition.requirements}
            </p>
          </div>
        )}

        {/* 応募フロー */}
        {steps.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3 text-foreground">応募フロー</h3>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                    {step.stepOrder}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <CheckCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1.5" />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                📋 応募後は各ステップごとに選考が進みます。進捗状況はマイページから確認できます。
              </p>
            </div>
          </div>
        )}

        {/* 応募ボタン */}
        <div className="mt-8 mb-10">
          {audition.status === 'published' ? (
            <Link href={`/liff/auditions/${audition.id}/apply`} className="block">
              <button className="w-full bg-gradient-to-r from-primary to-primary/70 text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/40 hover:shadow-primary/60 hover:from-primary/90 hover:to-primary/60 transition-all duration-200 transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                今すぐ応募する
              </button>
            </Link>
          ) : (
            <button 
              disabled 
              className="w-full bg-muted text-muted-foreground py-4 rounded-xl font-bold text-lg cursor-not-allowed"
            >
              {audition.status === 'closed' ? '応募受付終了' : '下書き'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
