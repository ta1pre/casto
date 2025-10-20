'use client'

/**
 * 主催者共通ヘッダー
 * [SF][CA] ナビゲーション・ユーザーメニュー・レスポンシブ対応
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { UserMenu } from './UserMenu'

interface OrganizerHeaderProps {
  user: {
    userId: string
    roles: string[]
    provider: string
  }
  onLogout: () => void
}

const navLinks = [
  { href: '/organizer/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/organizer/auditions', label: 'オーディション', icon: '🎭' },
  { href: '/organizer/points', label: 'ポイント', icon: '💰' },
  { href: '/organizer/profile', label: 'プロフィール', icon: '👤' },
  { href: '/organizer/settings', label: '設定', icon: '⚙️' },
]

export function OrganizerHeader({ user, onLogout }: OrganizerHeaderProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左側：ロゴ + ナビゲーション（デスクトップ） */}
          <div className="flex items-center space-x-8">
            {/* ロゴ */}
            <a href="/organizer/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">Casto</h1>
                <p className="text-xs text-gray-500">主催者管理</p>
              </div>
            </a>

            {/* ナビゲーション（デスクトップ） */}
            <nav className="hidden lg:flex space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* 右側：CTAボタン + ユーザーメニュー */}
          <div className="flex items-center space-x-4">
            {/* CTAボタン */}
            <Link
              href="/organizer/auditions/new"
              className="hidden md:inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              オーディション作成
            </Link>

            {/* ユーザーメニュー（デスクトップ） */}
            <div className="hidden lg:block">
              <UserMenu user={user} onLogout={onLogout} />
            </div>

            {/* ハンバーガーメニュー（モバイル） */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="メニュー"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* モバイルメニュー */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </a>
            ))}

            {/* モバイルCTAボタン */}
            <Link
              href="/organizer/auditions/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg text-center"
            >
              <svg
                className="w-4 h-4 inline-block mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              オーディション作成
            </Link>

            {/* モバイルユーザー情報 */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 truncate">{user.userId}</p>
                <div className="flex items-center gap-2 mt-1">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href="/organizer/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
              >
                プロフィール
              </a>

              <a
                href="/organizer/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
              >
                設定
              </a>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  onLogout()
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                ログアウト
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
