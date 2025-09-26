'use client'

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react'
import type { AuthContextType, User, AuthRole } from '../types/auth'
import { apiFetch, ApiError } from '@/utils/api'

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

type ApiUser = {
  id: string
  email?: string | null
  lineUserId?: string | null
  displayName?: string | null
  provider: 'email' | 'line'
  role: AuthRole
  tokenVersion?: number
  createdAt?: string
  updatedAt?: string
  pictureUrl?: string | null
  statusMessage?: string | null
}

const mapUser = (input: ApiUser | null | undefined): User | null => {
  if (!input) {
    return null
  }

  return {
    id: input.id,
    email: input.email ?? null,
    lineUserId: input.lineUserId ?? null,
    displayName: input.displayName ?? null,
    provider: input.provider,
    role: input.role,
    tokenVersion: input.tokenVersion,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    pictureUrl: input.pictureUrl ?? null,
    statusMessage: input.statusMessage ?? null
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const response = await apiFetch<{ user: ApiUser | null }>('/api/v1/auth/session', {
        method: 'GET'
      })

      const mapped = mapUser(response.user)
      setUser(mapped)
      return mapped
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        setUser(null)
        return null
      }
      console.error('Failed to refresh session:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      try {
        await refreshSession()
      } catch (error) {
        // ここではログ出力のみ。UIでの通知は担当ページで対応
        console.error('Initial session fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
  }, [refreshSession])

  const loginWithLine = useCallback(async (idToken: string): Promise<User> => {
    const response = await apiFetch<{ user: ApiUser }>('/api/v1/auth/line/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken })
    })

    const mapped = mapUser(response.user)
    if (!mapped) {
      throw new Error('LINE認証のレスポンスにユーザー情報が含まれていません')
    }

    setUser(mapped)
    return mapped
  }, [])

  const requestMagicLink = useCallback<
    AuthContextType['requestMagicLink']
  >(async ({ email, role, redirectUrl }) => {
    const response = await apiFetch<{ token: string; magicLinkUrl?: string }>(
      '/api/v1/auth/email/request',
      {
        method: 'POST',
        body: JSON.stringify({ email, role, redirectUrl })
      }
    )

    return response
  }, [])

  const verifyMagicLink = useCallback(async (token: string): Promise<User> => {
    const response = await apiFetch<{ user: ApiUser }>('/api/v1/auth/email/verify', {
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
