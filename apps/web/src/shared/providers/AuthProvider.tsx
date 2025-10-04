'use client'

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode
} from 'react'
import type { AuthContextType, User, AuthRole } from '../types/auth'
import type { UserResponse } from '@casto/shared'
import { apiFetch, ApiError } from '@/shared/lib/api'

const uninitialized = () => {
  throw new Error('AuthProvider is not initialized yet')
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

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[AuthProvider] Initializing...')
        await refreshSession()
        console.log('[AuthProvider] Initialization complete')
      } catch (error) {
        console.error('[AuthProvider] Initial session fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
  }, [refreshSession])

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
