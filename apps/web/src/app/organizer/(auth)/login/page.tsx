'use client'

/**
 * 主催者ログインページ
 * [SF][SFT] v0デザインを参考にしたシンプルなログインUI
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '../../_components/LoginForm'

export default function OrganizerLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/organizer/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'メールアドレスまたはパスワードが正しくありません')
      }

      // ログイン成功
      router.push(data.redirectUrl || '/organizer/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メールアドレスまたはパスワードが正しくありません')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">主催者ログイン</h1>
            <p className="text-sm text-gray-500 mt-2">Casto オーディション管理</p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ログインフォーム */}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          {/* フッター */}
          <div className="mt-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-xs text-gray-500">または</span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>
            <a
              href="./signup"
              className="block text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              新規アカウント作成
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
