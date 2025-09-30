'use client'

import React, { useState } from 'react'
import { useLiffAuth } from '@/hooks/useLiffAuth'

export default function LiffHomePage() {
  const {
    user,
    isLoading,
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
  const [showRawData, setShowRawData] = useState(false)
  const [showDebugLogs, setShowDebugLogs] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* アクション */}
        <section className="bg-white shadow-sm rounded-lg p-4 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">LIFFステータス</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatusItem label="LIFF Ready" value={isLiffReady} />
            <StatusItem label="Is Loading" value={isLoading} spinner />
            <StatusItem label="User Authenticated" value={!!user} />
            <StatusItem label="Error" text={error ?? 'なし'} isError={!!error} />
            <StatusItem label="env LIFF ID" value={diagnostics.envLiffIdConfigured} />
            <StatusItem label="window.liff" value={diagnostics.hasWindowLiff} />
            <StatusItem
              label="Script Load"
              text={diagnostics.scriptLoadState}
              isError={diagnostics.scriptLoadState === 'error'}
            />
            <StatusItem label="ReadyState" text={diagnostics.readyState ?? 'unknown'} />
          </div>

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
        </section>

        {/* タイムライン情報 */}
        <section className="bg-white shadow-sm rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">イベントタイムライン</h3>
          <TimelineItem label="最後のwindow.liffチェック" value={diagnostics.lastLiffCheckAt} note={diagnostics.lastLiffCheckReason} />
          <TimelineItem label="LIFF init開始" value={diagnostics.liffInitStartedAt} />
          <TimelineItem label="LIFF init完了" value={diagnostics.liffInitCompletedAt} />
          <TimelineItem label="プロフィール取得" value={diagnostics.profileFetchedAt} />
          <TimelineItem label="LINEログイン試行" value={diagnostics.lastLoginAttemptAt} />
          <TimelineItem label="LINEログイン成功" value={diagnostics.lastLoginSuccessAt} />
          <TimelineItem label="アプリ側ユーザー読み込み" value={diagnostics.authUserLoadedAt} />
        </section>

        {/* ユーザー情報 */}
        <section className="bg-white shadow-sm rounded-lg p-4">
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
              <KeyValue label="Display Name" value={user?.displayName ?? user?.name ?? '—'} />
              <KeyValue label="メール" value={user?.email ?? '—'} />
              <KeyValue label="LINE User ID" value={user?.lineUserId ?? '—'} />
              <KeyValue label="Role" value={user?.role ?? '—'} />
              <KeyValue label="Provider" value={user?.provider ?? '—'} />
            </div>
          </div>
        </section>

        {/* Raw JSON */}
        {showRawData && (
          <section className="bg-white shadow-sm rounded-lg p-4">
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
          </section>
        )}

        {/* Debug Logs */}
        {showDebugLogs && (
          <section className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="font-bold mb-2">デバッグログ</h3>
            <div className="text-xs bg-gray-900 text-green-200 p-3 rounded max-h-64 overflow-y-auto space-y-1 font-mono">
              {debugLogs.length > 0 ? (
                debugLogs.map((log, i) => <div key={i}>{log}</div>)
              ) : (
                <div className="text-gray-400">ログなし</div>
              )}
            </div>
          </section>
        )}
      </main>
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
