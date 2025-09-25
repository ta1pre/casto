/**
 * 認証プロバイダー（React Context）
 * 認証状態のグローバル管理
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import type { AuthState, LoginRequest } from '../types/auth'

interface AuthContextType extends AuthState {
  login: (request: LoginRequest) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isAuthenticated: () => boolean
  mutateSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  const contextValue: AuthContextType = {
    ...auth,
    // メソッドの再エクスポート（型安全性のため）
    login: auth.login,
    logout: auth.logout,
    refreshSession: auth.refreshSession,
    hasPermission: auth.hasPermission,
    hasRole: auth.hasRole,
    hasAnyPermission: auth.hasAnyPermission,
    hasAnyRole: auth.hasAnyRole,
    isAuthenticated: auth.isAuthenticated,
    mutateSession: auth.mutateSession
  }

  return (
    <AuthContext.Provider value={contextValue}>
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

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

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

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role))
  }

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
