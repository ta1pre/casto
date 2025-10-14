'use client'

/**
 * 主催者サインアップページ
 * [SF][SFT] メール認証による新規アカウント作成
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignupForm } from '../_components/SignupForm'

export default function OrganizerSignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/v1/organizer/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'アカウント作成に失敗しました')
      }

      // サインアップ成功
      setSuccess(data.message || '確認メールを送信しました。メールをご確認ください。')
      
      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/organizer/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アカウント作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              アカウント作成完了
            </h2>
            <p className="text-sm text-gray-600 mb-4">{success}</p>
            <p className="text-xs text-gray-500">
              ログインページに自動的に移動します...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">主催者アカウント作成</h1>
            <p className="text-sm text-gray-500 mt-2">Casto オーディション管理</p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* サインアップフォーム */}
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />

          {/* フッター */}
          <div className="mt-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-gray-300 flex-1" />
              <span className="text-xs text-gray-500">既にアカウントをお持ちの方</span>
              <div className="h-px bg-gray-300 flex-1" />
            </div>
            <a
              href="./login"
              className="block text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              ログインはこちら
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
