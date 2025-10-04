'use client'

import { useEffect, useState } from 'react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { useAuth } from '@/shared/hooks/useAuth'

export default function AuthFlowDebugPage() {
  const [cookies, setCookies] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)
  const liff = useLiffAuth()
  const auth = useAuth()

  useEffect(() => {
    setIsMounted(true)
    setCookies(document.cookie)
  }, [])

  if (!isMounted) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">認証フローデバッグ</h1>
        <p className="mt-4">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">認証フローデバッグ</h1>

      {/* LIFF認証状態 */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h2 className="font-bold mb-2">🔵 LIFF認証状態</h2>
        <div className="space-y-1 text-sm">
          <div>✓ isLiffReady: {String(liff.isLiffReady)}</div>
          <div>✓ isAuthenticating: {String(liff.isAuthenticating)}</div>
          <div>✓ liffProfile: {liff.liffProfile ? JSON.stringify(liff.liffProfile) : 'null'}</div>
          <div>✓ error: {liff.error || 'null'}</div>
        </div>
      </div>

      {/* Auth状態 */}
      <div className="border rounded-lg p-4 bg-green-50">
        <h2 className="font-bold mb-2">🟢 Auth状態</h2>
        <div className="space-y-1 text-sm">
          <div>✓ isLoading: {String(auth.isLoading)}</div>
          <div>✓ isAuthenticated: {String(auth.isAuthenticated)}</div>
          <div>✓ user: {auth.user ? JSON.stringify(auth.user) : 'null'}</div>
        </div>
      </div>

      {/* Cookie状態 */}
      <div className="border rounded-lg p-4 bg-yellow-50">
        <h2 className="font-bold mb-2">🟡 Cookie状態</h2>
        <div className="text-sm">
          <div className="font-mono text-xs break-all">
            {cookies || '(empty)'}
          </div>
        </div>
      </div>

      {/* 診断情報 */}
      <div className="border rounded-lg p-4 bg-purple-50">
        <h2 className="font-bold mb-2">🟣 診断情報</h2>
        <div className="space-y-1 text-xs font-mono">
          {Object.entries(liff.diagnostics).map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
        </div>
      </div>

      {/* デバッグログ */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="font-bold mb-2">📝 デバッグログ</h2>
        <div className="text-xs font-mono space-y-0.5 max-h-96 overflow-auto">
          {liff.debugLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      {/* アクション */}
      <div className="border rounded-lg p-4">
        <h2 className="font-bold mb-2">⚙️ アクション</h2>
        <div className="flex gap-2">
          <button
            onClick={() => liff.reinitializeLiff()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            LIFF再初期化
          </button>
          <button
            onClick={() => liff.refreshSession()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            セッション更新
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({
                liff: {
                  isLiffReady: liff.isLiffReady,
                  isAuthenticating: liff.isAuthenticating,
                  liffProfile: liff.liffProfile,
                  error: liff.error,
                  diagnostics: liff.diagnostics,
                  debugLogs: liff.debugLogs
                },
                auth: {
                  isLoading: auth.isLoading,
                  isAuthenticated: auth.isAuthenticated,
                  user: auth.user
                },
                cookies
              }, null, 2))
              alert('デバッグ情報をコピーしました')
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            全情報コピー
          </button>
        </div>
      </div>
    </div>
  )
}
