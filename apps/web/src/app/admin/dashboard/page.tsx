'use client'

/**
 * 管理者ダッシュボード
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { useAdminAuth } from '../_hooks/useAdminAuth'
import { useAdminStats } from '../_hooks/useAdminStats'
import { OverviewCards } from './_components/OverviewCards'
import { RecentActivity } from './_components/RecentActivity'

export default function AdminDashboardPage() {
  const { user, isLoading, logout } = useAdminAuth()
  const { stats, activities, loading: statsLoading, error } = useAdminStats()

  // 認証チェック中、または認証されていない場合はローディング表示
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-gray-500 mt-1">システム全体の統計と最新アクティビティ</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            ログアウト
          </button>
        </div>
        {/* ウェルカムカード */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">ようこそ、{user?.userId}さん！</h2>
          <p className="text-blue-100">Casto 運営管理システムへようこそ</p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* ユーザー情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ログイン情報</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">ユーザーID:</span>
              <span className="text-sm text-gray-900 font-mono">{user?.userId}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">ロール:</span>
              <div className="flex gap-2">
                {user?.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">認証方式:</span>
              <span className="text-sm text-gray-900">{user?.provider}</span>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <OverviewCards stats={stats} loading={statsLoading} />

        {/* 最新アクティビティ */}
        <div className="mt-8">
          <RecentActivity activities={activities} loading={statsLoading} />
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/admin/auditions"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-600">オーディション管理</span>
            </a>
            <a
              href="/admin/messaging"
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-600">メッセージ配信</span>
            </a>
            <button
              disabled
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50 cursor-not-allowed"
            >
              <span className="text-sm font-medium text-gray-600">ユーザー管理 (準備中)</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
