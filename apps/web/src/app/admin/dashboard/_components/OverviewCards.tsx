/**
 * KPI概要カード群
 * [SF][CA][RP] シンプル、クリーンアーキテクチャ、可読性優先
 */

import { StatCard } from '../../_components/StatCard'

interface OverviewCardsProps {
  stats: {
    totalUsers: number
    totalAuditions: number
    totalOrganizers: number
    totalApplications: number
    lineFriends: number
    monthlyMessages: number
  } | null
  loading?: boolean
}

export function OverviewCards({ stats, loading = false }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 総ユーザー数 */}
      <StatCard
        title="総ユーザー数"
        value={stats?.totalUsers.toLocaleString() || '0'}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        loading={loading}
      />

      {/* オーディション数 */}
      <StatCard
        title="オーディション数"
        value={stats?.totalAuditions.toLocaleString() || '0'}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
        loading={loading}
      />

      {/* 主催者数 */}
      <StatCard
        title="主催者数"
        value={stats?.totalOrganizers.toLocaleString() || '0'}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        loading={loading}
      />

      {/* 応募総数 */}
      <StatCard
        title="応募総数"
        value={stats?.totalApplications.toLocaleString() || '0'}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        iconBgColor="bg-yellow-100"
        iconColor="text-yellow-600"
        loading={loading}
      />

      {/* LINE友だち追加数 */}
      <StatCard
        title="LINE友だち追加"
        value={stats?.lineFriends.toLocaleString() || '0'}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>
        }
        iconBgColor="bg-pink-100"
        iconColor="text-pink-600"
        loading={loading}
      />

      {/* 今月の配信数 */}
      <StatCard
        title="今月の配信数"
        value={stats?.monthlyMessages.toLocaleString() || '0'}
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        }
        iconBgColor="bg-indigo-100"
        iconColor="text-indigo-600"
        loading={loading}
      />
    </div>
  )
}
