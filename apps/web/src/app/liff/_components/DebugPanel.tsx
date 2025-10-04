'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { StatusItem, TimelineItem, KeyValue } from './DebugUI'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'

type DebugPanelProps = ReturnType<typeof useLiffAuth>

/**
 * LIFF開発者向けデバッグパネル
 * 本番環境では削除または環境変数で制御することを推奨
 */
export function DebugPanel({
  user,
  liffProfile,
  isLoading,
  error,
  isLiffReady,
  debugLogs,
  clearDebugLogs,
  diagnostics,
  reinitializeLiff,
  refreshSession,
  logout
}: DebugPanelProps) {
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [showDebugLogs, setShowDebugLogs] = useState(true)

  return (
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
              onClick={() => { void reinitializeLiff() }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              LIFF再初期化
            </button>
            <button
              onClick={() => { clearDebugLogs() }}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              ログクリア
            </button>
            <button
              onClick={() => { void refreshSession() }}
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
                onClick={() => { void logout() }}
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
                {JSON.stringify({ diagnostics, user, liffProfile }, null, 2)}
              </pre>
            </div>
          )}

          {/* Debug Logs */}
          {showDebugLogs && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">デバッグログ</h3>
              <div className="text-xs bg-gray-900 text-green-200 p-3 rounded max-h-64 overflow-y-auto space-y-1 font-mono">
                {debugLogs.length > 0 ? (
                  debugLogs.map((log: string, i: number) => <div key={i}>{log}</div>)
                ) : (
                  <div className="text-gray-400">ログなし</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
