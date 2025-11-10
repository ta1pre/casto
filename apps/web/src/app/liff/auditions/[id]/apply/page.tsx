/**
 * オーディション応募ページ
 * [SF][CA] 新しいステップベースの応募システム
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { apiFetch, ApiError } from '@/shared/lib/api'
import { formatDateJa } from '@/shared/lib/date'
import type { Audition, AuditionStep, AuditionApplication, ExtraApplicationData } from '@casto/shared'

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading: isAuthLoading, error: authError } = useLiffAuth()
  const [audition, setAudition] = useState<Audition | null>(null)
  const [steps, setSteps] = useState<AuditionStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [auditionId, setAuditionId] = useState<string | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [extraNotes, setExtraNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // paramsの解決
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setAuditionId(resolvedParams.id)
    }
    void resolveParams()
  }, [params])

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !auditionId) return

      try {
        setIsLoading(true)
        setError(null)

        // オーディション情報取得（ステップ情報も含まれる）
        const auditionResponse = await apiFetch<{ audition: Audition }>(
          `/api/v1/talent/auditions/${auditionId}`
        )
        setAudition(auditionResponse.audition)
        
        // ステップ情報をセット
        if (auditionResponse.audition.steps) {
          setSteps(auditionResponse.audition.steps)
        }

        // 既に応募済みかチェック
        try {
          const applicationsResponse = await fetch('/api/v1/talent/audition-applications', {
            credentials: 'include',
          })
          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json()
            const alreadyApplied = applicationsData.applications?.some(
              (app: AuditionApplication) => app.auditionId === auditionId
            )
            setHasApplied(alreadyApplied)
          }
        } catch (err) {
          console.log('Applications check failed (non-critical):', err)
        }
      } catch (err: unknown) {
        console.error('Failed to fetch data:', err)
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('データの取得に失敗しました')
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (user && auditionId) {
      void fetchData()
    }
  }, [user, auditionId])

  const extraNotesLabel = useMemo(() => {
    if (!audition) return 'この募集での追加事項'

    switch (audition.projectType) {
      case 'job':
        return '求人応募での追加事項'
      case 'extra':
        return 'エキストラ募集での追加事項'
      default:
        return 'この募集での追加事項'
    }
  }, [audition])

  const submitApplication = async () => {
    if (!auditionId) return

    try {
      setIsSubmitting(true)
      setError(null)

      // LIFFアクセストークンを取得（通知送信用）
      let liffAccessToken: string | null = null
      try {
        if (typeof window !== 'undefined' && window.liff?.isLoggedIn()) {
          liffAccessToken = window.liff.getAccessToken?.() || null
          console.log('[Apply] LIFF access token取得成功:', !!liffAccessToken)
        } else {
          console.warn('[Apply] LIFF not ready or not logged in')
        }
      } catch (liffError) {
        console.warn('[Apply] LIFF access token取得失敗:', liffError)
      }

      const extraApplicationData: ExtraApplicationData | Record<string, unknown> | undefined =
        extraNotes.trim().length > 0 ? { notes: extraNotes.trim() } : undefined

      const response = await fetch('/api/v1/talent/audition-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          auditionId,
          liffAccessToken, // 通知送信用
          extraApplicationData,
        }),
      })

      if (response.ok) {
        alert('応募を受け付けました！\n審査結果をお待ちください。')
        router.push('/liff/applications')
      } else {
        const errorData = await response.json()
        setError(errorData.details || errorData.error || '応募に失敗しました')
      }
    } catch (err) {
      console.error('Failed to submit application:', err)
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApplyClick = () => {
    if (extraNotes.length > 500) {
      setValidationError('追加事項は500文字以内で入力してください')
      return
    }

    setValidationError(null)
    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    setIsConfirmOpen(false)
    await submitApplication()
  }

  const handleCancelConfirm = () => {
    if (!isSubmitting) {
      setIsConfirmOpen(false)
    }
  }

  if (isAuthLoading || isLoading) {
    return <LoadingScreen message="読み込み中..." />
  }

  if (authError) {
    return <ErrorScreen message={authError} />
  }

  if (!user) {
    return <ErrorScreen message="認証に失敗しました" />
  }

  if (error && !audition) {
    return <ErrorScreen message={error} onRetry={() => router.back()} />
  }

  if (!audition) {
    return <LoadingScreen message="オーディション情報を取得中..." />
  }

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <p className="text-yellow-800 font-medium">
              このオーディションには既に応募済みです
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/liff/applications"
              className="block w-full bg-primary text-primary-foreground border border-primary py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              マイ応募一覧へ
            </Link>
            <button
              onClick={() => router.back()}
              className="block w-full bg-background border border-border py-3 rounded-lg font-medium hover:bg-muted transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ヘッダー */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">応募内容確認</h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="px-4 py-6 space-y-4">
        {/* オーディション情報 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {audition.title}
          </h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              応募期間: {formatDateJa(audition.applicationStartDate)}
              {' 〜 '}
              {formatDateJa(audition.applicationEndDate)}
            </p>
            {audition.maxApplicants && (
              <p>定員: {audition.maxApplicants}名</p>
            )}
          </div>
        </div>

        {/* 選考フロー */}
        {steps.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-3 text-foreground">選考フロー</h3>
            <div className="space-y-2">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {step.stepOrder}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 追加事項入力 */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{extraNotesLabel}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              この募集で特にアピールしたい点や、主催者に伝えたい追加情報などがあればご記入ください。
            </p>
          </div>
          <div>
            <textarea
              value={extraNotes}
              onChange={(event) => {
                setExtraNotes(event.target.value)
                if (validationError && event.target.value.length <= 500) {
                  setValidationError(null)
                }
              }}
              maxLength={500}
              rows={5}
              placeholder="例: 撮影経験があり、指定の日時すべて参加可能です など"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>最大500文字</span>
              <span>{extraNotes.length}/500</span>
            </div>
          </div>
          {validationError && (
            <p className="text-sm text-red-600">{validationError}</p>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* 応募ボタン */}
        <div className="mt-6 mb-8 space-y-3">
          <button
            onClick={handleApplyClick}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground border border-primary py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSubmitting ? '送信中...' : '応募する'}
          </button>
          <button
            onClick={() => router.back()}
            className="block w-full bg-background border border-border py-3 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            キャンセル
          </button>
        </div>

      </main>

      {/* 応募確認モーダル */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-card border border-border rounded-lg max-w-sm w-full p-6 space-y-4 shadow-lg">
            <div>
              <h2 className="text-lg font-semibold text-foreground">応募内容を送信しますか？</h2>
              <p className="text-sm text-muted-foreground mt-1">
                応募後はマイ応募一覧から進捗を確認できます。内容を確認のうえ送信してください。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCancelConfirm}
                className="w-full sm:w-auto bg-background border border-border py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                戻る
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="w-full sm:w-auto bg-primary text-primary-foreground border border-primary py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                応募を送信する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
