'use client'

import { useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { useProfileData } from './profile/_hooks/useProfileData'
import { DebugPanel } from './_components/DebugPanel'

export default function LiffHomePage() {
  const router = useRouter()
  const liffAuth = useLiffAuth()
  const { profile, loading: isProfileLoading, refetch } = useProfileData()
  
  // ホーム画面がマウントされたら最新データを取得
  useEffect(() => {
    refetch()
  }, [refetch])

  const { user, isLoading: isAuthLoading, error } = liffAuth
  const isLoading = isAuthLoading || isProfileLoading

  const completionRate = useMemo(() => {
    return profile?.completion_rate ?? 0
  }, [profile])

  // 完成度に応じた色の決定 [DRY]
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return { bar: 'bg-gradient-to-r from-green-400 to-green-600', text: 'text-green-600' }
    if (rate >= 25) return { bar: 'bg-gradient-to-r from-blue-300 to-blue-500', text: 'text-blue-500' }
    return { bar: 'bg-gradient-to-r from-gray-300 to-gray-400', text: 'text-gray-500' }
  }

  const progressColor = getProgressColor(completionRate)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* ウェルカムセクション */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          ようこそ{user?.displayName ? `、${user.displayName}さん` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">あなたのオーディション活動</p>
      </div>

      {/* プロフィール完成度 */}
      <section 
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors"
        onClick={() => router.push('/liff/profile')}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">プロフィール完成度</h3>
          <span className={`text-2xl font-bold ${progressColor.text}`}>{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`${progressColor.bar} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${completionRate}%` }} 
          />
        </div>
        <p className="text-xs text-muted-foreground">
          プロフィールを完成させて、より多くのオーディションに応募しましょう
        </p>
      </section>

      {/* ダッシュボード統計（仮） */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-1">応募中</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-1">閲覧済み</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-1">お気に入り</p>
        </div>
      </div>

      {/* クイックアクション */}
      <section className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">クイックアクション</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:bg-accent transition-colors">
            <span className="text-2xl mb-2">🔍</span>
            <span className="text-sm font-medium">オーディションを探す</span>
          </button>
          <button
            onClick={() => router.push('/liff/profile')}
            className="flex flex-col items-center justify-center p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <span className="text-2xl mb-2">👤</span>
            <span className="text-sm font-medium">プロフィール編集</span>
          </button>
        </div>
      </section>

      {/* デバッグパネル */}
      <DebugPanel {...liffAuth} />
    </div>
  )
}
