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
import { verifyAdminAuth } from '../../../middleware/verifyRoleAuth'
import { getOverviewStats, getRecentActivities } from './service'

const router = new Hono<AppBindings>()

// 全ルートに管理者認証を適用
router.use('/*', verifyAdminAuth)

/**
 * ダッシュボード統計値取得
 * 
 * @route GET /api/v1/admin/stats/overview
 * @access Admin only
 */
router.get('/overview', async (c) => {
  try {
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
