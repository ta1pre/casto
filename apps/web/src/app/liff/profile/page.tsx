'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { LoadingScreen } from '@/shared/components/LoadingScreen'
import { ErrorScreen } from '@/shared/components/ErrorScreen'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, error } = useLiffAuth()

  if (isLoading) {
    return <LoadingScreen message="読み込み中..." />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  if (!user) {
    return <ErrorScreen message="認証に失敗しました" />
  }

  // TODO: プロフィールデータをAPIから取得
  const hasProfile = false

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center relative">
          <button
            onClick={() => router.push('/liff')}
            className="absolute left-4 text-primary hover:text-primary/80 font-medium"
          >
            ← 戻る
          </button>
          <h1 className="text-xl font-medium tracking-wide text-foreground">プロフィール</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!hasProfile ? (
          <Card>
            <CardHeader>
              <CardTitle>プロフィール未登録</CardTitle>
              <CardDescription>
                オーディションに応募するには、プロフィール登録が必要です
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/liff/profile/new')} className="w-full">
                プロフィールを登録する
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>プロフィール情報</CardTitle>
                <CardDescription>登録されているプロフィール</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  プロフィール表示機能は実装中です
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
