/**
 * 応募詳細ページ（タレント用）
 * [SF][CA] 選考進捗と評価結果の確認
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import type { AuditionApplication } from '@casto/shared'

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useLiffAuth()
  const [application, setApplication] = useState<AuditionApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)

  // paramsの解決
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setApplicationId(resolvedParams.id)
    }
    void resolveParams()
  }, [params])

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !applicationId) return

      try {
        setIsLoading(true)
        setError(null)

        // 応募情報取得
        const appResponse = await fetch(`/api/v1/talent/audition-applications/${applicationId}`, {
          credentials: 'include',
        })

        if (appResponse.ok) {
          const appData = await appResponse.json()
          setApplication(appData.application)
        } else {
          setError('応募情報の取得に失敗しました')
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('データの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && applicationId) {
      void fetchData()
    }
  }, [user, applicationId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />
      case 'in_progress':
        return <AlertCircle className="h-5 w-5" />
      case 'passed':
        return <CheckCircle className="h-5 w-5" />
      case 'rejected':
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      passed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-gray-200 text-gray-600',
    }
    const labels = {
      pending: '未審査',
      in_progress: '審査中',
      passed: '合格',
      rejected: '不合格',
      withdrawn: '辞退',
    }
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${styles[status as keyof typeof styles] || styles.pending}`}>
        {getStatusIcon(status)}
        <span className="font-medium">{labels[status as keyof typeof labels] || status}</span>
      </div>
    )
  }

  if (isAuthLoading || isLoading) {
    return <LoadingScreen message="読み込み中..." />
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => router.back()} />
  }

  if (!application) {
    return <ErrorScreen message="応募情報が見つかりません" />
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ヘッダー */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/liff/applications" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">応募詳細</h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="px-4 py-6 space-y-4">
        {/* オーディション情報 */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {application.auditionTitle || 'オーディション'}
          </h2>
          <p className="text-sm text-muted-foreground">
            応募日: {new Date(application.appliedAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* 現在のステータス */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 text-foreground">現在のステータス</h3>
          <div className="flex items-center justify-between">
            {getStatusBadge(application.overallStatus)}
          </div>
          {application.currentStep && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-medium">現在のステップ:</span> {application.currentStep.title}
              </p>
              {application.currentStep.description && (
                <p className="text-sm text-blue-800 mt-1">
                  {application.currentStep.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ステータスメッセージ */}
        <div className={`border rounded-lg p-4 ${
          application.overallStatus === 'passed' ? 'bg-green-50 border-green-200' :
          application.overallStatus === 'rejected' ? 'bg-red-50 border-red-200' :
          application.overallStatus === 'in_progress' ? 'bg-blue-50 border-blue-200' :
          'bg-gray-50 border-gray-200'
        }`}>
          <p className={`text-sm font-medium ${
            application.overallStatus === 'passed' ? 'text-green-900' :
            application.overallStatus === 'rejected' ? 'text-red-900' :
            application.overallStatus === 'in_progress' ? 'text-blue-900' :
            'text-gray-700'
          }`}>
            {application.overallStatus === 'pending' && '📋 書類選考の結果をお待ちください'}
            {application.overallStatus === 'in_progress' && '⏳ 選考が進行中です。結果をお待ちください'}
            {application.overallStatus === 'passed' && '🎉 おめでとうございます！合格です！'}
            {application.overallStatus === 'rejected' && '今回は残念ながら不合格となりました'}
            {application.overallStatus === 'withdrawn' && '応募を取り下げました'}
          </p>
        </div>

        {/* 注意事項 */}
        {application.overallStatus === 'in_progress' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">選考について</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>選考結果は随時更新されます</li>
              <li>合格した場合、次のステップに進みます</li>
              <li>詳細な連絡はメールまたはLINEでお知らせします</li>
            </ul>
          </div>
        )}

        {application.overallStatus === 'passed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-900 mb-2">次のステップ</h3>
            <p className="text-sm text-green-800">
              主催者から今後の詳細についてご連絡いたします。<br />
              メールやLINEのメッセージをご確認ください。
            </p>
          </div>
        )}
      </main>

      {/* アクション */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/liff/applications"
            className="block w-full text-center border border-border py-3 rounded-lg font-medium hover:bg-muted"
          >
            応募一覧に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
