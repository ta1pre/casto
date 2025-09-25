/**
 * 認証状態を表示するヘッダーコンポーネント
 * ロール切り替え機能付き
 */

'use client'

import React, { useState } from 'react'
import { useAuthContext } from '../providers/AuthProvider'
import type { Role } from '../types/auth'

interface HeaderProps {
  onRoleSwitch?: (role: Role) => void
}

export function Header({ onRoleSwitch }: HeaderProps) {
  const { user, logout, loading } = useAuthContext()
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleRoleSwitch = (role: Role) => {
    if (onRoleSwitch) {
      onRoleSwitch(role)
    }
    setShowRoleMenu(false)
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ/タイトル */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {process.env.NEXT_PUBLIC_APP_NAME || 'CASTOR'}
            </h1>
          </div>

          {/* 認証状態表示 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* ユーザー情報 */}
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-gray-500">
                      {user.email || `LINE: ${user.lineUserId?.slice(0, 8)}...`}
                    </div>
                  </div>

                  {/* ロール表示/切り替え */}
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleMenu(!showRoleMenu)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                      <span className="text-sm font-medium">
                        {user.roles.length > 0 ? user.roles[0].name : 'No Role'}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          showRoleMenu ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* ロール切り替えメニュー */}
                    {showRoleMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          {user.roles.map((role) => (
                            <button
                              key={role.id}
                              onClick={() => handleRoleSwitch(role)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <div className="font-medium">{role.name}</div>
                              <div className="text-xs text-gray-500">{role.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ログアウトボタン */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                未認証
              </div>
            )}

            {/* 権限表示（デバッグ用） */}
            {process.env.NODE_ENV === 'development' && user && (
              <div className="text-xs text-gray-400 max-w-xs truncate">
                Permissions: {user.permissions.map(p => p.name).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ロールメニューの外側クリックで閉じる */}
      {showRoleMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowRoleMenu(false)}
        />
      )}
    </header>
  )
}

/**
 * 権限ベースでコンテンツを表示するコンポーネント
 */
interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  role?: string
  roles?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  permissions,
  role,
  roles,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole } = useAuthContext()

  // 権限チェック
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  if (permissions && !hasAnyPermission(permissions)) {
    return <>{fallback}</>
  }

  // ロールチェック
  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  if (roles && !hasAnyRole(roles)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * 管理者専用コンテンツ
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <PermissionGuard roles={['admin']} fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

/**
 * 認証必須コンテンツ
 */
export function AuthRequired({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext()

  if (!isAuthenticated()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
