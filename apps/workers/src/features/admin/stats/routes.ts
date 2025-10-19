/**
 * Admin統計API ルート
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 * 
 * GET /api/v1/admin/stats/*
 * 
 * 注意: 管理者認証必須
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { getOverviewStats, getRecentActivities } from './service'

const router = new Hono<AppBindings>()

/**
 * ダッシュボード統計値取得
 * 
 * @route GET /api/v1/admin/stats/overview
 * @access Admin only
 */
router.get('/overview', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    const stats = await getOverviewStats(supabase)

    return c.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('[GET /admin/stats/overview] Error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch overview stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 最新アクティビティ取得
 * 
 * @route GET /api/v1/admin/stats/recent-activities
 * @access Admin only
 */
router.get('/recent-activities', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const limit = Number(c.req.query('limit')) || 10

    const supabase = createSupabaseClient(c)
    const activities = await getRecentActivities(supabase, limit)

    return c.json({
      success: true,
      data: activities,
    })
  } catch (error) {
    console.error('[GET /admin/stats/recent-activities] Error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch recent activities',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default router
