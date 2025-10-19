/**
 * Admin統計サービス
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface OverviewStats {
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

export interface RecentActivity {
  id: string
  type: 'application' | 'audition' | 'message'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * ダッシュボード統計値を取得
 */
export async function getOverviewStats(
  supabase: SupabaseClient
): Promise<OverviewStats> {
  try {
    // 並行でデータ取得
    const [usersRes, auditionsRes, organizersRes, applicationsRes, friendsRes] =
      await Promise.all([
        // 総ユーザー数
        supabase.from('users').select('id', { count: 'exact', head: true }),
        // オーディション数
        supabase.from('auditions').select('status', { count: 'exact' }),
        // 主催者数（organizersテーブルがない場合はusersのroleで代用）
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'organizer'),
        // 応募総数
        supabase
          .from('audition_applications')
          .select('id', { count: 'exact', head: true }),
        // LINE友だち追加済みユーザー数
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('line_friendship_status', 'friend'),
      ])

    // ステータス別オーディション数を集計
    const auditionsByStatus = {
      draft: 0,
      published: 0,
      closed: 0,
    }

    if (auditionsRes.data) {
      for (const audition of auditionsRes.data) {
        const status = audition.status as keyof typeof auditionsByStatus
        if (status in auditionsByStatus) {
          auditionsByStatus[status]++
        }
      }
    }

    // 今月のメッセージ送信数
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: monthlyMessages } = await supabase
      .from('messaging_logs')
      .select('id', { count: 'exact', head: true })
      .gte('sent_at', startOfMonth.toISOString())

    return {
      totalUsers: usersRes.count || 0,
      totalAuditions: auditionsRes.count || 0,
      totalOrganizers: organizersRes.count || 0,
      totalApplications: applicationsRes.count || 0,
      lineFriends: friendsRes.count || 0,
      monthlyMessages: monthlyMessages || 0,
      auditionsByStatus,
    }
  } catch (error) {
    console.error('[getOverviewStats] Error:', error)
    throw new Error('Failed to fetch overview stats')
  }
}

/**
 * 最新アクティビティを取得
 */
export async function getRecentActivities(
  supabase: SupabaseClient,
  limit = 10
): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = []

    // 最新の応募（5件）
    const { data: applications } = await supabase
      .from('audition_applications')
      .select(
        `
        id,
        created_at,
        auditions (
          title
        ),
        users (
          display_name
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(5)

    if (applications) {
      for (const app of applications) {
        const user = app.users as any
        const audition = app.auditions as any
        activities.push({
          id: app.id,
          type: 'application',
          title: '新規応募',
          description: `${user?.display_name || '名前未設定'} が「${
            audition?.title || '不明なオーディション'
          }」に応募しました`,
          timestamp: app.created_at,
        })
      }
    }

    // 最新のオーディション（5件）
    const { data: auditions } = await supabase
      .from('auditions')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (auditions) {
      for (const audition of auditions) {
        activities.push({
          id: audition.id,
          type: 'audition',
          title: 'オーディション作成',
          description: `「${audition.title}」が作成されました（${audition.status}）`,
          timestamp: audition.created_at,
        })
      }
    }

    // タイムスタンプでソートして制限
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return activities.slice(0, limit)
  } catch (error) {
    console.error('[getRecentActivities] Error:', error)
    throw new Error('Failed to fetch recent activities')
  }
}
