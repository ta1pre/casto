'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useProfileData } from './profile/_hooks/useProfileData'

export default function LiffHomePage() {
  const router = useRouter()
  const {
    user,
    isLoading: isAuthLoading,
    error,
    liffProfile,
    logout,
    isLiffReady,
    debugLogs,
    clearDebugLogs,
    diagnostics,
    reinitializeLiff,
    refreshSession
  } = useLiffAuth()
  const { profile, loading: isProfileLoading } = useProfileData()
  const [showRawData, setShowRawData] = useState(false)
  const [showDebugLogs, setShowDebugLogs] = useState(true)
  const [showDebugPanel, setShowDebugPanel] = useState(false)

  const isLoading = isAuthLoading || isProfileLoading

  const completionRate = useMemo(() => {
    return profile?.completion_rate ?? 0
  }, [profile])

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
          <span className="text-2xl font-bold text-green-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
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

      {/* デバッグパネル（折りたたみ可能） */}
      <section className="bg-card border border-border rounded-lg">
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors rounded-lg"
        >
          <span className="font-semibold text-foreground">🔧 開発者向けデバッグパネル</span>
          {showDebugPanel ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {showDebugPanel && (
          <div className="border-t border-border p-4 space-y-4">
            {/* 警告 */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ 注意: このページはパソコンからのアクセスではLIFF SDKが動作しません。LINEアプリ内でのみ正常に動作します。
                診断情報が空の場合、LINEアプリ内でページを再読み込みしてください。
              </p>
            </div>

            {/* ステータスグリッド */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatusItem label="LIFF Ready" value={isLiffReady} />
              <StatusItem label="Is Loading" value={isLoading} spinner />
              <StatusItem label="User Authenticated" value={!!user} />
              <StatusItem label="Error" text={error ?? 'なし'} isError={!!error} />
              <StatusItem label="env LIFF ID" value={diagnostics.envLiffIdConfigured} />
              <StatusItem label="LIFF ID (一部)" text={process.env.NEXT_PUBLIC_LINE_LIFF_ID ? `${process.env.NEXT_PUBLIC_LINE_LIFF_ID.slice(0, 8)}...` : '未設定'} />
              <StatusItem label="window.liff" value={diagnostics.hasWindowLiff} />
              <StatusItem
                label="Script Load"
                text={diagnostics.scriptLoadState}
                isError={diagnostics.scriptLoadState === 'error'}
              />
              <StatusItem label="scriptElementCount" text={diagnostics.scriptElementCount.toString()} />
              <StatusItem label="scriptAppendedAt" text={diagnostics.scriptAppendedAt ?? '—'} />
              <StatusItem label="layoutScriptLoadedAt" text={diagnostics.layoutScriptLoadedAt ?? '—'} />
              <StatusItem label="layoutScriptErrorAt" text={diagnostics.layoutScriptErrorAt ?? '—'} />
              <StatusItem label="layoutScriptHasLiff" text={diagnostics.layoutScriptHasLiff?.toString() ?? '—'} />
            </div>

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-2 pt-2 text-sm">
              <button
                onClick={() => {
                  void reinitializeLiff()
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                LIFF再初期化
              </button>
              <button
                onClick={() => {
                  clearDebugLogs()
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                ログクリア
              </button>
              <button
                onClick={() => {
                  void refreshSession()
                }}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                セッション再取得
              </button>
              <button
                onClick={() => setShowRawData((prev) => !prev)}
                className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                {showRawData ? '診断JSONを隠す' : '診断JSONを表示'}
              </button>
              <button
                onClick={() => setShowDebugLogs((prev) => !prev)}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                {showDebugLogs ? 'デバッグログを隠す' : 'デバッグログを表示'}
              </button>
              {user && (
                <button
                  onClick={() => {
                    void logout()
                  }}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  ログアウト
                </button>
              )}
            </div>

            {/* タイムライン情報 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">イベントタイムライン</h3>
              <TimelineItem label="最後のwindow.liffチェック" value={diagnostics.lastLiffCheckAt} note={diagnostics.lastLiffCheckReason} />
              <TimelineItem label="LIFF init開始" value={diagnostics.liffInitStartedAt} />
              <TimelineItem label="LIFF init完了" value={diagnostics.liffInitCompletedAt} />
              <TimelineItem label="プロフィール取得" value={diagnostics.profileFetchedAt} />
              <TimelineItem label="LINEログイン試行" value={diagnostics.lastLoginAttemptAt} />
              <TimelineItem label="LINEログイン成功" value={diagnostics.lastLoginSuccessAt} />
              <TimelineItem label="アプリ側ユーザー読み込み" value={diagnostics.authUserLoadedAt} />
              <TimelineItem label="スクリプト追加" value={diagnostics.scriptAppendedAt} />
              <TimelineItem label="レイアウトスクリプトロード" value={diagnostics.layoutScriptLoadedAt} />
              <TimelineItem label="レイアウトスクリプトエラー" value={diagnostics.layoutScriptErrorAt} />
            </div>

            {/* ユーザー情報 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">デバッグ情報</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">LINEプロフィール</h4>
                  <KeyValue label="User ID" value={liffProfile?.userId} />
                  <KeyValue label="Display Name" value={liffProfile?.displayName} />
                  <KeyValue label="Picture URL" value={liffProfile?.pictureUrl} />
                  <KeyValue label="Status Message" value={liffProfile?.statusMessage} />
                  <KeyValue label="ID Token (一部)" value={diagnostics.idTokenSnippet} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">アプリユーザー</h4>
                  <KeyValue label="ID" value={user?.id} />
                  <KeyValue label="Display Name" value={user?.displayName ?? '—'} />
                  <KeyValue label="メール" value={user?.email ?? '—'} />
                  <KeyValue label="LINE User ID" value={user?.lineUserId ?? '—'} />
                  <KeyValue label="Role" value={user?.role ?? '—'} />
                  <KeyValue label="Provider" value={user?.lineUserId ? 'line' : user?.email ? 'email' : '—'} />
                </div>
              </div>
            </div>

            {/* Raw JSON */}
            {showRawData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold mb-2">診断JSON</h3>
                <pre className="text-xs overflow-auto bg-gray-900 text-green-200 p-3 rounded max-h-64">
{JSON.stringify(
  {
    diagnostics,
    user,
    liffProfile
  },
  null,
  2
)}
                </pre>
              </div>
            )}

            {/* Debug Logs */}
            {showDebugLogs && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold mb-2">デバッグログ</h3>
                <div className="text-xs bg-gray-900 text-green-200 p-3 rounded max-h-64 overflow-y-auto space-y-1 font-mono">
                  {debugLogs.length > 0 ? (
                    debugLogs.map((log, i) => <div key={i}>{log}</div>)
                  ) : (
                    <div className="text-gray-400">ログなし</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function StatusItem({
  label,
  value,
  text,
  spinner = false,
  isError = false
}: {
  label: string
  value?: boolean
  text?: string
  spinner?: boolean
  isError?: boolean
}) {
  return (
    <div className="flex flex-col bg-gray-100 rounded p-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        {spinner && value ? (
          <span className="inline-block h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : null}
        {typeof value === 'boolean' ? (value ? '✅' : '❌') : null}
        {text && (
          <span className={isError ? 'text-red-600' : 'text-gray-800'}>{text}</span>
        )}
      </span>
    </div>
  )
}

function TimelineItem({ label, value, note }: { label: string; value: string | null; note?: string | null }) {
  return (
    <div className="flex flex-col border-l-2 border-gray-300 pl-3 mb-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-mono text-gray-900">{value ?? '—'}</span>
      {note ? <span className="text-xs text-gray-600">理由: {note}</span> : null}
    </div>
  )
}

function KeyValue({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-gray-200 py-1">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-900 break-all">{value ?? '—'}</span>
    </div>
  )
}
