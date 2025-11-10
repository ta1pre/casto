'use client'

import { useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { useOfficialLineStatus } from '@/shared/hooks/useOfficialLineStatus'
import { useProfileData } from './profile/_hooks/useProfileData'

export default function LiffHomePage() {
  const router = useRouter()
  const liffAuth = useLiffAuth()
  const { profile, loading: isProfileLoading, refetch } = useProfileData()
  const { isFriend, loading: isFriendLoading } = useOfficialLineStatus()
  
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
    // トークン更新失敗時の特別な処理 [REH]
    const isTokenRefreshError = error.includes('トークンの更新に失敗')
    
    return (
      <div className="px-4 py-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive font-medium">エラーが発生しました</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          
          {isTokenRefreshError && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="w-full bg-primary text-primary-foreground border border-primary px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                ページを再読み込み
              </button>
              <p className="text-xs text-muted-foreground text-center">
                問題が解決しない場合は、LINEアプリを再起動してください
              </p>
            </div>
          )}
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

      {/* 公式LINE友だち追加状態 */}
      <section className="bg-card border border-border rounded-lg p-4">
        {isFriendLoading ? (
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-muted rounded mb-2"></div>
            <div className="h-3 w-48 bg-muted rounded"></div>
          </div>
        ) : isFriend === true ? (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">公式LINE参加済み</h3>
              <p className="text-sm text-muted-foreground">オーディション通知を受け取れる状態です</p>
            </div>
          </div>
        ) : isFriend === false ? (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">公式LINEに参加しよう</h3>
              <p className="text-sm text-muted-foreground mb-3">
                オーディションの通知や最新情報を受け取るために、公式LINEへの参加をお勧めします
              </p>
              <a
                href={process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_URL || "https://lin.ee/586kihzi"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#06C755] text-white px-4 py-2 rounded-md hover:bg-[#05B34A] transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                公式LINEに参加する
              </a>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">公式LINE状態を確認中</h3>
              <p className="text-sm text-muted-foreground">しばらくお待ちください</p>
            </div>
          </div>
        )}
      </section>

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
    </div>
  )
}
