'use client'

/**
 * Admin統計データ取得フック
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 */

import { useState, useEffect } from 'react'

interface OverviewStats {
  totalUsers: number
  totalAuditions: number
  totalOrganizers: number
  totalApplications: number
  lineFriends: number
  monthlyMessages: number
  auditionsByStatus: {
    draft: number
    published: number
    closed: number
  }
}

interface RecentActivity {
  id: string
  type: 'application' | 'audition' | 'message'
  title: string
  description: string
  timestamp: string
}

export function useAdminStats() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/v1/admin/stats/overview', {
          credentials: 'include',
        }),
        fetch('/api/v1/admin/stats/recent-activities?limit=10', {
          credentials: 'include',
        }),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.data)
      } else {
        throw new Error('統計データの取得に失敗しました')
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json()
        setActivities(data.data)
      }
    } catch (err) {
      console.error('[useAdminStats] Error:', err)
      setError(err instanceof Error ? err.message : '統計データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    activities,
    loading,
    error,
    refetch: fetchStats,
  }
}
