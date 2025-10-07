'use client'

import { useEffect, useState } from 'react'
import { useLiffAuth } from '@/shared/hooks/useLiffAuth'
import { useAuth } from '@/shared/hooks/useAuth'

export default function AuthFlowDebugPage() {
  const [cookies, setCookies] = useState<string>('')
  const [isMounted, setIsMounted] = useState(false)
  const {
    isLiffReady,
    isAuthenticating,
    liffProfile,
    error,
    refreshSession,
    user,
    isLoading
  } = useLiffAuth()
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
          <div>✓ isLiffReady: {String(isLiffReady)}</div>
          <div>✓ isAuthenticating: {String(isAuthenticating)}</div>
          <div>✓ isLoading: {String(isLoading)}</div>
          <div>✓ liffProfile: {liffProfile ? JSON.stringify(liffProfile) : 'null'}</div>
          <div>✓ user: {user ? JSON.stringify(user) : 'null'}</div>
          <div>✓ error: {error || 'null'}</div>
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

      {/* ブラウザ情報 */}
      <div className="border rounded-lg p-4 bg-purple-50">
        <h2 className="font-bold mb-2">🟣 ブラウザ情報</h2>
        <div className="space-y-1 text-xs font-mono">
          <div>UserAgent: {navigator.userAgent}</div>
          <div>Location: {window.location.href}</div>
        </div>
      </div>

      {/* アクション */}
      <div className="border rounded-lg p-4">
        <h2 className="font-bold mb-2">⚙️ アクション</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              void refreshSession()
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            セッション更新
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({
                liff: {
                  isLiffReady,
                  isAuthenticating,
                  isLoading,
                  liffProfile,
                  user,
                  error
                },
                auth: {
                  isLoading: auth.isLoading,
                  isAuthenticated: auth.isAuthenticated,
                  user: auth.user
                },
                cookies,
                browser: {
                  userAgent: navigator.userAgent,
                  location: window.location.href
                }
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
