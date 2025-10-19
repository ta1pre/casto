'use client'

/**
 * 友だち追加状態サマリー
 * [SF][RP] シンプル、可読性優先
 */

interface FriendshipStatsProps {
  stats: {
    total: number
    friends: number
    blocked: number
    unknown: number
  } | null
  loading: boolean
}

export function FriendshipStats({ stats, loading }: FriendshipStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">友だち追加状態</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">友だち追加状態</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 全ユーザー */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">全ユーザー</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        {/* 友だち追加済み */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-1">友だち追加</div>
          <div className="text-3xl font-bold text-green-600">{stats.friends}</div>
          <div className="text-xs text-green-600 mt-1">
            {stats.total > 0 ? Math.round((stats.friends / stats.total) * 100) : 0}%
          </div>
        </div>

        {/* ブロック */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="text-sm text-red-700 mb-1">ブロック</div>
          <div className="text-3xl font-bold text-red-600">{stats.blocked}</div>
          <div className="text-xs text-red-600 mt-1">
            {stats.total > 0 ? Math.round((stats.blocked / stats.total) * 100) : 0}%
          </div>
        </div>

        {/* 不明 */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-700 mb-1">状態不明</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.unknown}</div>
          <div className="text-xs text-yellow-600 mt-1">
            {stats.total > 0 ? Math.round((stats.unknown / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  )
}
