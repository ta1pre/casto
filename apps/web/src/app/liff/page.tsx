'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/AuthProvider'

export default function LiffPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { login, isAuthenticated } = useAuthContext()
  const router = useRouter()
  const initializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (initializedRef.current) return
    initializedRef.current = true

    const ensureLiffInstance = (): Promise<typeof window.liff> => {
      if (window.liff) {
        return Promise.resolve(window.liff)
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
        script.onload = () => resolve(window.liff)
        script.onerror = () => reject(new Error('LIFF SDKの読み込みに失敗しました'))
        document.head.appendChild(script)
      })
    }

    const initializeLIFF = async () => {
      try {
        setLoading(true)

        const liff = await ensureLiffInstance()
        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID!
        })

        if (!liff.isLoggedIn()) {
          liff.login({
            redirectUri: `${window.location.origin}/liff`
          })
          return
        }

        const idToken = liff.getIDToken()

        if (!idToken) {
          setError('LINEのIDトークンを取得できませんでした')
          return
        }

        const success = await login({
          provider: 'line',
          code: idToken
        })

        if (success) {
          router.replace('/dashboard')
        } else {
          setError('認証に失敗しました')
        }
      } catch (err) {
        console.error('LIFF initialization error:', err)
        setError('LIFFの初期化に失敗しました')
        initializedRef.current = false
      } finally {
        setLoading(false)
      }
    }

    initializeLIFF()
  }, [login, router])

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated()) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">LINE認証中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">CASTOR</h1>
          <p className="text-gray-600 mb-6">オーディション情報システム</p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>LINE認証完了</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>認証処理中...</span>
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-400">
            <p>このページはLINEアプリ内でのみ動作します</p>
          </div>
        </div>
      </div>
    </div>
  )
}
