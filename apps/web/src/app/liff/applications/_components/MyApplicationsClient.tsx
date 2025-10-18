/**
 * マイ応募一覧クライアント（ステップ対応版）
 * [SF][CA] タレント向け応募管理
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import type { AuditionApplication } from '@casto/shared'

export function MyApplicationsClient() {
  const { user, isLoading: isAuthLoading } = useLiffAuth()
  const [applications, setApplications] = useState<AuditionApplication[]>([])
  const [isLoading, setIsLoading] = useState(false) // 初期値をfalseに [SF]
  const [filter, setFilter] = useState<string>('all')

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams()
      if (filter !== 'all') {
        queryParams.append('status', filter)
      }

      const response = await fetch(`/api/v1/talent/audition-applications?${queryParams}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user, fetchApplications])

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('応募を取り下げますか？\nこの操作は取り消せません。')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/talent/audition-applications/${applicationId}/withdraw`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (response.ok) {
        alert('応募を取り下げました')
        await fetchApplications()
      } else {
        const error = await response.json()
        alert(error.error || '応募の取り下げに失敗しました')
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error)
      alert('ネットワークエラーが発生しました')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />
      case 'passed':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'withdrawn':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      unread: 'bg-blue-100 text-blue-800',
      pending: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-blue-100 text-blue-800',
      passed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-300 text-gray-600',
    }
    const labels = {
      unread: '審査中',
      pending: '審査中',
      in_progress: '審査中',
      passed: '選考通過',
      rejected: '落選',
      withdrawn: '辞退',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
      }`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  if (isAuthLoading || isLoading) {
    return <LoadingScreen message="読み込み中..." />
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">マイ応募</h1>
      </div>

      {/* ステータスタブ */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'pending'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          未審査
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'in_progress'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          審査中
        </button>
        <button
          onClick={() => setFilter('passed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'passed'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          合格
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'rejected'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          不合格
        </button>
      </div>

      {/* 応募リスト */}
      {applications.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            {filter === 'all' ? '応募履歴がありません' : 'このステータスの応募はありません'}
          </p>
          <Link
            href="/liff/auditions"
            className="inline-block mt-4 text-primary hover:text-primary/80 font-medium"
          >
            オーディションを探す →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {app.auditionTitle || 'オーディション'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    応募日: {new Date(app.appliedAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {getStatusBadge(app.overallStatus)}
              </div>

              {/* 現在のステップ */}
              {app.currentStep && (
                <div className="mb-3 text-sm text-muted-foreground">
                  <span className="font-medium">現在:</span> {app.currentStep.title}
                </div>
              )}

              {/* ステータスメッセージ */}
              <p className="text-sm text-muted-foreground mb-3">
                {(app.overallStatus === 'unread' || app.overallStatus === 'pending' || app.overallStatus === 'in_progress') && '選考が進行中です。結果をお待ちください'}
                {app.overallStatus === 'passed' && 'おめでとうございます！選考通過です'}
                {app.overallStatus === 'rejected' && '今回は残念ながら落選となりました'}
                {app.overallStatus === 'withdrawn' && '応募を取り下げました'}
              </p>

              {/* アクション */}
              <div className="flex gap-2">
                <Link
                  href={`/liff/applications/${app.id}`}
                  className="flex-1 text-center py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  詳細を見る
                </Link>
                {app.overallStatus !== 'withdrawn' && app.overallStatus !== 'passed' && app.overallStatus !== 'rejected' && (
                  <button
                    onClick={() => handleWithdraw(app.id)}
                    className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted"
                  >
                    取り下げ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
