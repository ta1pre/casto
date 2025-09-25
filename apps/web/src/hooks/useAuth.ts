/**
 * セッション管理のためのReactフック
 * SWRを使用したキャッシュ機能付き
 */

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import type { AuthState, Session, User, LoginRequest } from '../types/auth'

const SESSION_STORAGE_KEY = 'auth_session'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  // SWRでセッション情報を取得
  const {
    data: sessionData,
    error: sessionError,
    mutate: mutateSession,
    isLoading: sessionLoading
  } = useSWR<Session>('/auth/session', async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getStoredAccessToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401) {
        // 未認証の場合
        clearStoredSession()
        return null
      }

      if (!response.ok) {
        throw new Error(`Session fetch failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.success ? result.session : null
    } catch (error) {
      console.error('Session fetch error:', error)
      return null
    }
  }, {
    refreshInterval: 5 * 60 * 1000, // 5分ごとに更新
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 1000, // 1秒以内の重複リクエストを防ぐ
  })

  // セッション状態の更新
  useEffect(() => {
    if (sessionData) {
      const user: User = {
        id: sessionData.userId,
        displayName: sessionData.displayName,
        roles: sessionData.roles,
        permissions: sessionData.permissions,
        provider: sessionData.provider,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: sessionData.lastActivity
      }

      setAuthState({
        user,
        session: sessionData,
        loading: false,
        error: null
      })

      // セッション情報をストレージに保存
      storeSession(sessionData)
    } else {
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: sessionError?.message || null
      })

      // セッション情報がなければストレージをクリア
      if (!sessionLoading) {
        clearStoredSession()
      }
    }
  }, [sessionData, sessionError, sessionLoading])

  /**
   * ログイン処理
   */
  const login = useCallback(async (request: LoginRequest): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      })

      const result = await response.json()

      if (result.success && result.session) {
        // セッション情報を更新
        await mutateSession(result.session, false)

        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Login failed'
        }))
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Login failed'
      }))
      return false
    }
  }, [mutateSession])

  /**
   * ログアウト処理
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getStoredAccessToken()}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // セッション情報をクリア
      await mutateSession(null, false)
      clearStoredSession()
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      })
    }
  }, [mutateSession])

  /**
   * セッション更新
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getStoredAccessToken()}`
        }
      })

      const result = await response.json()

      if (result.success && result.session) {
        await mutateSession(result.session, false)
        return true
      } else {
        await logout()
        return false
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      await logout()
      return false
    }
  }, [mutateSession, logout])

  /**
   * 権限チェック
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return authState.user?.permissions.some(p => p.name === permission) || false
  }, [authState.user])

  /**
   * ロールチェック
   */
  const hasRole = useCallback((role: string): boolean => {
    return authState.user?.roles.some(r => r.name === role) || false
  }, [authState.user])

  /**
   * 複数の権限のいずれかを持つかチェック
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }, [hasPermission])

  /**
   * 複数のロールのいずれかを持つかチェック
   */
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }, [hasRole])

  /**
   * 認証済みかどうかチェック
   */
  const isAuthenticated = useCallback((): boolean => {
    return !!authState.session && new Date() < new Date(authState.session.expiresAt)
  }, [authState.session])

  return {
    // 状態
    user: authState.user,
    session: authState.session,
    loading: authState.loading || sessionLoading,
    error: authState.error,

    // メソッド
    login,
    logout,
    refreshSession,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    isAuthenticated,

    // SWR utilities
    mutateSession
  }
}

/**
 * アクセストークンをストレージから取得
 */
function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null')
    return session?.accessToken || null
  } catch {
    return null
  }
}

/**
 * セッション情報をストレージに保存
 */
function storeSession(session: Session): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Failed to store session:', error)
  }
}

/**
 * セッション情報をストレージからクリア
 */
function clearStoredSession(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}
