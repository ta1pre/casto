'use client'

/**
 * 無料枠モニター
 * [SF][RP] シンプル、可読性優先
 */

interface MessagingQuotaProps {
  stats: {
    monthlyQuota: number
    sent: number
    remaining: number
    exceeded: boolean
    percentage: number
  } | null
  loading: boolean
}

export function MessagingQuota({ stats, loading }: MessagingQuotaProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">無料枠残量</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">無料枠残量</h2>
      <div>
        <div className="flex items-end gap-4 mb-4">
          <div className="text-4xl font-bold text-blue-600">
            {stats.remaining}
          </div>
          <div className="text-gray-600 mb-1">/ {stats.monthlyQuota}通</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all ${
              stats.percentage >= 90 ? 'bg-red-500' : 
              stats.percentage >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(stats.percentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">
          今月の使用量: {stats.sent}通 ({stats.percentage}%)
          {stats.exceeded && (
            <span className="ml-2 text-red-600 font-medium">⚠️ 無料枠を超過しています</span>
          )}
        </p>
      </div>
    </div>
  )
}
