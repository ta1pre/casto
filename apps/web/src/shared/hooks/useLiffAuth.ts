'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

/**
 * LIFF認証フック（簡素化版）[SF][PA]
 * 
 * AuthProviderでLIFF初期化を行うため、このhookは単にAuthContextから
 * 状態を取得して、LINEアプリ内判定を追加するだけのシンプルなhookになりました。
 */

interface UseLiffAuthReturn {
  user: ReturnType<typeof useAuth>['user']
  isLoading: boolean
  isLiffReady: boolean
  error: string | null
  logout: () => Promise<void>
  refreshSession: ReturnType<typeof useAuth>['refreshSession']
  isInClient: boolean // LINEアプリ内かどうか [SF]
}

// LINEアプリ内判定 [SF]
function isInLineClient(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (typeof window.liff?.isInClient === 'function') {
      return window.liff.isInClient()
    }
  } catch (error) {
    console.warn('[useLiffAuth] Failed to call liff.isInClient()', error)
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
  return ua.includes('line/')
}

export function useLiffAuth(): UseLiffAuthReturn {
  const { user, isLoading, logout, refreshSession } = useAuth()
  const [inClient, setInClient] = useState(false)
  
  // LINEアプリ内判定（クライアントサイドのみ）[PA]
  useEffect(() => {
    setInClient(isInLineClient())
  }, [])
  
  // LIFF初期化状態（window.liffの存在で判定）
  const isLiffReady = typeof window !== 'undefined' && !!window.liff

  return {
    user,
    isLoading,
    isLiffReady,
    error: null, // AuthProviderでエラーハンドリング
    logout,
    refreshSession,
    isInClient: inClient
  }
}
