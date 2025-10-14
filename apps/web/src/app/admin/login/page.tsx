'use client'

/**
 * 管理者ログインページ
 * [SF][SFT] v0デザインを参考にしたシンプルなログインUI
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginForm } from '@/app/admin/_components/LoginForm'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/admin/auth/login', {
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
      router.push(data.redirectUrl || '/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メールアドレスまたはパスワードが正しくありません')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">管理者ログイン</h1>
            <p className="text-sm text-gray-500 mt-2">Casto 運営管理システム</p>
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
              className="block text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              新規アカウント作成
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
