/**
 * 認証プロバイダー（React Context）
 * 認証状態のグローバル管理
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { UseAuthReturn } from '../hooks/useAuth'

type AuthContextType = UseAuthReturn

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 認証コンテキストを使用するフック
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }

  return context
}

/**
 * 権限チェック用のフック
 */
export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthContext()

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}

/**
 * ロールチェック用のフック
 */
export function useRoles() {
  const { hasRole, hasAnyRole, hasAllRoles } = useAuthContext()

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles
  }
}

/**
 * 認証状態チェック用のフック
 */
export function useAuthStatus() {
  const { isAuthenticated, loading, error } = useAuthContext()

  return {
    isAuthenticated,
    loading,
    error,
    isLoading: loading
  }
}
