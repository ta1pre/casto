'use client'

/**
 * ユーザー友だち状態一覧
 * [SF][RP] シンプル、可読性優先
 */

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string | null
  line_user_id: string | null
  line_friendship_status: boolean | null
  line_friendship_updated_at: string | null
  created_at: string
}

interface UserFriendshipListProps {
  initialUsers?: User[]
  initialTotal?: number
}

type FilterStatus = 'all' | 'friends' | 'blocked' | 'unknown'

export function UserFriendshipList({ initialUsers = [], initialTotal = 0 }: UserFriendshipListProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchUsers()
  }, [filter, page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const offset = page * limit
      const res = await fetch(
        `/api/v1/internal/messaging/users?status=${filter}&limit=${limit}&offset=${offset}`,
        { credentials: 'include' }
      )

      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter)
    setPage(0)
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          友だち追加
        </span>
      )
    } else if (status === false) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ブロック
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          不明
        </span>
      )
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">ユーザー一覧</h2>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全て ({total})
        </button>
        <button
          onClick={() => handleFilterChange('friends')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'friends'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          友だち追加
        </button>
        <button
          onClick={() => handleFilterChange('blocked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'blocked'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ブロック
        </button>
        <button
          onClick={() => handleFilterChange('unknown')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unknown'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          状態不明
        </button>
      </div>

      {/* テーブル */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LINE User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">友だち状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      ユーザーが見つかりません
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                        {user.line_user_id ? (
                          <span className="truncate max-w-[200px] inline-block" title={user.line_user_id}>
                            {user.line_user_id}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(user.line_friendship_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.line_friendship_updated_at
                          ? new Date(user.line_friendship_updated_at).toLocaleString('ja-JP')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('ja-JP')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                全{total}件中 {page * limit + 1}〜{Math.min((page + 1) * limit, total)}件を表示
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
