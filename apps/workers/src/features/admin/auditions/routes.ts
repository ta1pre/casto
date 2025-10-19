/**
 * Admin オーディション管理API ルート
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 * 
 * GET /api/v1/admin/auditions
 * GET /api/v1/admin/auditions/:id
 * 
 * 注意: 管理者認証必須
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { getAuditions, getAuditionDetail } from './service'

const router = new Hono<AppBindings>()

/**
 * オーディション一覧取得
 * 
 * @route GET /api/v1/admin/auditions
 * @access Admin only
 */
router.get('/', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const status = c.req.query('status')
    const limit = Number(c.req.query('limit')) || 50
    const offset = Number(c.req.query('offset')) || 0

    const supabase = createSupabaseClient(c)
    const result = await getAuditions(supabase, {
      status,
      limit,
      offset,
    })

    return c.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[GET /admin/auditions] Error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch auditions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * オーディション詳細取得
 * 
 * @route GET /api/v1/admin/auditions/:id
 * @access Admin only
 */
router.get('/:id', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    const audition = await getAuditionDetail(supabase, auditionId)

    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    return c.json({
      success: true,
      audition,
    })
  } catch (error) {
    console.error('[GET /admin/auditions/:id] Error:', error)
    return c.json(
      {
        success: false,
        error: 'Failed to fetch audition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default router
