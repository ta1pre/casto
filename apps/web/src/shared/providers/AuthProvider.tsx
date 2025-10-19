'use client'

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode
} from 'react'
import type { AuthContextType, User, AuthRole } from '../types/auth'
import type { UserResponse } from '@casto/shared'
import { apiFetch, ApiError } from '@/shared/lib/api'

// LIFF SDK型定義
declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string; withLoginOnExternalBrowser?: boolean }) => Promise<void>
      isLoggedIn: () => boolean
      login: (config?: { redirectUri?: string }) => void
      logout: () => void
      getIDToken?: () => string | null
      getAccessToken?: () => string | null
      isInClient?: () => boolean
    }
  }
}

const LIFF_SCRIPT_SRC = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
const TOKEN_EXP_SKEW_MS = 5 * 1000 // トークン期限の余裕（5秒）

const uninitialized = () => {
  throw new Error('AuthProvider is not initialized yet')
}

// LIFF初期化済みフラグ（グローバル）[SF][PA]
let globalLiffInitialized = false

// トークン期限をデコード [SF][PA]
function decodeTokenExpiration(token: string): number | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return typeof json.exp === 'number' ? json.exp * 1000 : null
  } catch {
    return null
  }
}

// トークンが有効かチェック [SF][PA]
function isTokenValid(token: string): boolean {
  const exp = decodeTokenExpiration(token)
  if (!exp) return false
  return exp > Date.now() + TOKEN_EXP_SKEW_MS
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  loginWithLine: async () => {
    uninitialized()
    return Promise.reject()
  },
  requestMagicLink: async () => {
    uninitialized()
    return Promise.reject()
  },
  verifyMagicLink: async () => {
    uninitialized()
    return Promise.reject()
  },
  logout: async () => {
    uninitialized()
  },
  refreshSession: async () => {
    uninitialized()
    return Promise.reject()
  }
})

interface AuthProviderProps {
  children: ReactNode
}

const mapUser = (input: UserResponse | null | undefined): User | null => {
  if (!input) {
    return null
  }
  return input
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initializingRef = useRef(false)

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      console.log('[AuthProvider] Fetching session...')
      const response = await apiFetch<{ user: UserResponse | null }>('/api/v1/auth/session', {
        method: 'GET'
      })

      console.log('[AuthProvider] Session fetched:', response)
      const mapped = mapUser(response.user)
      setUser(mapped)
      return mapped
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        console.log('[AuthProvider] No session found (401/404), clearing user state')
        setUser(null)
        return null
      }
      console.error('[AuthProvider] Failed to refresh session:', error)
      throw error
    }
  }, [])

  // LIFF初期化 + 認証（1回だけ実行）[SF][PA][REH]
  useEffect(() => {
    if (initializingRef.current) {
      console.log('[AuthProvider] Already initializing, skipping')
      return
    }
    
    initializingRef.current = true
    
    const initialize = async () => {
      try {
        console.log('[AuthProvider] Starting initialization...')
        
        // 1. LIFF SDK初期化（グローバルフラグでチェック）
        if (!globalLiffInitialized) {
          await initializeLiff()
          globalLiffInitialized = true
        }
        
        // 2. LINEログイン済みならトークン検証（期限チェック付き）[SF][PA]
        if (typeof window !== 'undefined' && window.liff?.isLoggedIn?.()) {
          const idToken = window.liff?.getIDToken?.()
          if (idToken) {
            // トークン期限を事前チェック（無駄な401リクエスト排除）[PA]
            if (isTokenValid(idToken)) {
              console.log('[AuthProvider] LINE token valid, authenticating...')
              await loginWithLine(idToken)
              console.log('[AuthProvider] LINE authentication complete')
              return
            } else {
              console.log('[AuthProvider] LINE token expired, skipping to session check')
            }
          }
        }
        
        // 3. セッションチェック（LINEログインしていない場合 or トークン期限切れ）
        await refreshSession()
        console.log('[AuthProvider] Initialization complete')
      } catch (error) {
        console.error('[AuthProvider] Initialization failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
  }, []) // 空の依存配列で1回だけ実行

  // 定期的なセッションリフレッシュ（20分ごと）[REH]
  // JWTの有効期限（24時間）より十分前にリフレッシュしてクッキーを延長
  useEffect(() => {
    if (!user) return

    const REFRESH_INTERVAL = 20 * 60 * 1000 // 20分
    console.log('[AuthProvider] Starting session refresh timer (20min interval)')

    const intervalId = setInterval(async () => {
      if (document.hidden) {
        console.log('[AuthProvider] Skipping session refresh (page hidden)')
        return
      }

      try {
        console.log('[AuthProvider] Periodic session refresh triggered')
        await refreshSession()
        console.log('[AuthProvider] Periodic session refresh successful')
      } catch (error) {
        console.error('[AuthProvider] Periodic session refresh failed:', error)
      }
    }, REFRESH_INTERVAL)

    return () => {
      clearInterval(intervalId)
      console.log('[AuthProvider] Session refresh timer stopped')
    }
  }, [user, refreshSession])

  const loginWithLine = useCallback(async (idToken: string): Promise<User> => {
    console.log('[AuthProvider] Logging in with LINE...')
    const response = await apiFetch<{ user: UserResponse }>('/api/v1/auth/line/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    })

    console.log('[AuthProvider] LINE login response:', response)
    const mapped = mapUser(response.user)
    if (!mapped) {
      throw new Error('LINE認証のレスポンスにユーザー情報が含まれていません')
    }

    setUser(mapped)
    console.log('[AuthProvider] User state updated:', mapped)
    return mapped
  }, [])

  const requestMagicLink = useCallback<AuthContextType['requestMagicLink']>(
    async (params) => {
      const { email, role, redirectUrl } = params

      const response = await apiFetch<{ token: string; magicLinkUrl?: string }>(
        '/api/v1/auth/email/request',
        {
          method: 'POST',
          body: JSON.stringify({ email, role, redirectUrl })
        }
      )
      return response
    },
    []
  )

  const verifyMagicLink = useCallback(async (token: string): Promise<User> => {
    const response = await apiFetch<{ user: UserResponse }>('/api/v1/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    })

    const mapped = mapUser(response.user)
    if (!mapped) {
      throw new Error('メール認証のレスポンスにユーザー情報が含まれていません')
    }

    setUser(mapped)
    return mapped
  }, [])

  const logout = useCallback(async () => {
    try {
      // LIFFログアウト
      if (typeof window !== 'undefined' && window.liff?.isLoggedIn()) {
        window.liff.logout()
      }
      
      // APIログアウト
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        parseJson: false
      })
    } catch (error) {
      console.error('Failed to logout:', error)
    } finally {
      setUser(null)
    }
  }, [])
  
  // LIFF SDK初期化関数 [SF][PA]
  const initializeLiff = async () => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID || process.env.NEXT_PUBLIC_LIFF_ID
    if (!liffId) {
      console.error('[AuthProvider] LIFF ID not configured')
      return
    }
    
    // LIFF SDK読み込み
    if (typeof window === 'undefined') return
    
    if (!window.liff) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = LIFF_SCRIPT_SRC
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load LIFF SDK'))
        document.head.appendChild(script)
      })
    }
    
    // LIFF初期化
    try {
      await window.liff!.init({
        liffId,
        withLoginOnExternalBrowser: true
      })
      console.log('[AuthProvider] LIFF initialized successfully')
    } catch (error) {
      console.error('[AuthProvider] LIFF initialization failed:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithLine,
    requestMagicLink,
    verifyMagicLink,
    logout,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
