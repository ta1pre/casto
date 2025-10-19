'use client'

/**
 * パスワード新規設定ページ（管理者）
 * [SF][SFT] リセットトークンを使ってパスワードを更新
 */

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [tokenHash, setTokenHash] = useState<string | null>(null)
  const [tokenType, setTokenType] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // URLからアクセストークンを取得
    // Supabaseは2つのフローをサポート:
    // 1. Implicit Flow: ハッシュフラグメント（#access_token=...）
    // 2. PKCE Flow: クエリパラメータ（?token_hash=...&type=recovery）
    
    if (typeof window === 'undefined') return
    
    // 既に初期化済みの場合はスキップ
    if (initialized) {
      console.log('[Admin Reset] Already initialized, skipping URL parsing')
      return
    }
    
    console.log('[Admin Reset] Page loaded, checking URL params')
    console.log('[Admin Reset] Full URL:', window.location.href)
    console.log('[Admin Reset] Hash:', window.location.hash)
    console.log('[Admin Reset] Search:', window.location.search)
    
    const hash = window.location.hash.substring(1) // # を除去
    const params = new URLSearchParams(hash)
    
    // エラーチェック
    const errorParam = params.get('error')
    const errorCode = params.get('error_code')
    const errorDescription = params.get('error_description')
    
    if (errorParam) {
      console.log('[Admin Reset] Error in URL:', { errorParam, errorCode, errorDescription })
      if (errorCode === 'otp_expired') {
        setError('リンクの有効期限が切れています。パスワードリセットメールは1時間で無効になります。もう一度申請してください。')
      } else {
        setError(errorDescription ? decodeURIComponent(errorDescription) : '無効なリンクです。もう一度パスワードリセットを申請してください。')
      }
      return // エラーがある場合は処理を中断
    }
    
    // Implicit Flowのトークン
    const hashToken = params.get('access_token')
    
    // PKCE Flowのトークン
    const queryToken = searchParams.get('access_token')
    // PKCE Flowのtoken_hash（verifyOtpで使用）
    const tokenHashParam = searchParams.get('token_hash')
    const type = searchParams.get('type')
    
    console.log('[Admin Reset] Extracted params:', { hashToken: !!hashToken, queryToken: !!queryToken, tokenHash: !!tokenHashParam, type })
    
    if (hashToken) {
      // Implicit Flow
      console.log('[Admin Reset] Using Implicit Flow')
      setAccessToken(hashToken)
      // ハッシュをクリア（ブラウザの履歴に残さない）
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    } else if (queryToken) {
      // PKCE Flow（クエリパラメータにaccess_token）
      console.log('[Admin Reset] Using PKCE Flow (query access_token)')
      setAccessToken(queryToken)
    } else if (tokenHashParam && type === 'recovery') {
      // PKCE Flow（token_hashを保存するだけ、検証は後で）
      // Gmail/Chromeの先読みでトークンが消費されないよう、ユーザーのクリックまで待つ
      console.log('[Admin Reset] Using PKCE Flow (token_hash), waiting for user click')
      setTokenHash(tokenHashParam)
      setTokenType(type)
    } else {
      console.error('[Admin Reset] No valid token found')
      setError('無効なリンクです。もう一度パスワードリセットを申請してください。')
    }
    
    // 初期化完了
    setInitialized(true)
  }, [searchParams, initialized])

  const verifyTokenHash = async (hash: string, type: string) => {
    setIsVerifying(true)
    setError(null)
    try {
      console.log('[Admin Reset] Verifying token hash...')
      const response = await fetch('/api/v1/admin/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token_hash: hash, type }),
        credentials: 'include',
      })

      const data = await response.json()
      console.log('[Admin Reset] Verify response:', { status: response.status, data })

      if (!response.ok || !data.access_token) {
        console.error('[Admin Reset] Verification failed:', data)
        throw new Error('トークンの検証に失敗しました')
      }

      console.log('[Admin Reset] Verification successful, setting access token')
      setAccessToken(data.access_token)
      setTokenHash(null) // 検証済みなのでクリア
      setTokenType(null)
      setError(null) // エラーを明示的にクリア
    } catch (err) {
      console.error('[Admin Reset] Error during verification:', err)
      setError('リンクの有効期限が切れています。もう一度パスワードリセットを申請してください。')
      setAccessToken(null) // エラー時はaccessTokenをクリア
    } finally {
      setIsVerifying(false)
    }
  }

  const handleStartReset = async () => {
    if (tokenHash && tokenType) {
      await verifyTokenHash(tokenHash, tokenType)
    }
  }

  const validatePassword = (pwd: string, confirm: string) => {
    if (pwd.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください')
      return false
    }
    if (pwd !== confirm) {
      setPasswordError('パスワードが一致しません')
      return false
    }
    setPasswordError(null)
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!accessToken) {
      setError('無効なリンクです')
      return
    }
    
    if (!validatePassword(password, confirmPassword)) {
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/admin/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken,
          newPassword: password 
        }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの更新に失敗しました')
      }

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/admin/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パスワードの更新に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
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
              パスワードを更新しました
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              新しいパスワードでログインしてください
            </p>
            <p className="text-xs text-gray-500">
              ログインページに自動的に移動します...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // token_hashがあり、まだ検証していない場合は「開始」ボタンを表示
  if (tokenHash && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                パスワードをリセット
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                パスワードリセットメールからアクセスしました。<br />
                下のボタンをクリックして新しいパスワードを設定してください。
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleStartReset}
              disabled={isVerifying}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? '確認中...' : 'パスワードリセットを開始'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              ※ このリンクは1回のみ有効です
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                無効なリンク
              </h2>
              <p className="text-sm text-gray-600">
                {error}
              </p>
            </div>
            <a
              href="/admin/forgot-password"
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 text-center transition-colors"
            >
              パスワードリセットを申請
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">新しいパスワード設定</h1>
            <p className="text-sm text-gray-500 mt-2">
              新しいパスワードを入力してください
            </p>
          </div>

          {/* エラー表示 */}
          {passwordError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{passwordError}</p>
            </div>
          )}

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 新しいパスワード */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (confirmPassword) {
                      validatePassword(e.target.value, confirmPassword)
                    }
                  }}
                  required
                  disabled={isLoading}
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="8文字以上"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                ※ 半角英数字を含む8文字以上で設定してください
              </p>
            </div>

            {/* パスワード確認 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (password) {
                    validatePassword(password, e.target.value)
                  }
                }}
                required
                disabled={isLoading}
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="もう一度入力してください"
              />
              {passwordError && (
                <p className="text-xs text-red-600 mt-1">{passwordError}</p>
              )}
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading || !!passwordError}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  更新中...
                </>
              ) : (
                'パスワードを更新'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}
