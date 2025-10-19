/**
 * 統計カード共通コンポーネント
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  bgColor?: string
  iconBgColor?: string
  iconColor?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon,
  bgColor = 'bg-white',
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className={`${bgColor} rounded-xl shadow-sm border border-gray-200 p-6`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${bgColor} rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
