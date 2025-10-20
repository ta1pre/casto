/**
 * Admin向けポイント管理APIルート
 * 
 * 設計原則: [SF][REH][CA]
 * - Admin権限チェック
 * - エラーハンドリング
 * - バリデーション
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { verifyAdminAuth } from '../../../middleware/verifyRoleAuth'
import {
  pointsGrantRequestSchema,
  createPointsPlanSchema,
  updatePointsPlanSchema,
  updatePointsSettingsSchema,
  updateGenreCostSchema,
} from '@casto/shared'
import {
  getAllAccounts,
  getAccountDetail,
  grantPointsAdmin,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  updateSettings,
  getGenreCosts,
  updateGenreCost,
} from './service'

const adminPointsRoutes = new Hono<AppBindings>()

// Admin権限チェックを全ルートに適用
adminPointsRoutes.use('/*', verifyAdminAuth)

/**
 * GET /api/v1/admin/points/accounts
 * 全アカウント一覧取得
 */
adminPointsRoutes.get('/accounts', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const limit = parseInt(c.req.query('limit') || '50', 10)
    const offset = parseInt(c.req.query('offset') || '0', 10)

    const result = await getAllAccounts(supabase, limit, offset)

    return c.json(result)
  } catch (error) {
    console.error('[Admin Points] Failed to get accounts:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get accounts' },
      500
    )
  }
})

/**
 * GET /api/v1/admin/points/accounts/:id
 * アカウント詳細取得
 */
adminPointsRoutes.get('/accounts/:id', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const accountId = c.req.param('id')

    const account = await getAccountDetail(supabase, accountId)

    if (!account) {
      return c.json({ error: 'Account not found' }, 404)
    }

    return c.json({ account })
  } catch (error) {
    console.error('[Admin Points] Failed to get account detail:', error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get account detail',
      },
      500
    )
  }
})

/**
 * POST /api/v1/admin/points/grant
 * ポイント手動付与/減算
 */
adminPointsRoutes.post('/grant', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const body = await c.req.json()
    const validated = pointsGrantRequestSchema.parse(body)

    await grantPointsAdmin(supabase, {
      userId: validated.userId,
      amount: validated.amount,
      transactionType: validated.transactionType,
      notes: validated.reason,
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('[Admin Points] Failed to grant points:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to grant points' },
      400
    )
  }
})

/**
 * GET /api/v1/admin/points/plans
 * ポイントプラン一覧取得
 */
adminPointsRoutes.get('/plans', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const plans = await getAllPlans(supabase)

    return c.json({ plans })
  } catch (error) {
    console.error('[Admin Points] Failed to get plans:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get plans' },
      500
    )
  }
})

/**
 * POST /api/v1/admin/points/plans
 * ポイントプラン作成
 */
adminPointsRoutes.post('/plans', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const body = await c.req.json()
    const validated = createPointsPlanSchema.parse(body)

    const plan = await createPlan(supabase, validated)

    return c.json({ plan })
  } catch (error) {
    console.error('[Admin Points] Failed to create plan:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to create plan' },
      400
    )
  }
})

/**
 * PATCH /api/v1/admin/points/plans/:id
 * ポイントプラン更新
 */
adminPointsRoutes.patch('/plans/:id', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const planId = c.req.param('id')

    const body = await c.req.json()
    const validated = updatePointsPlanSchema.parse(body)

    const plan = await updatePlan(supabase, planId, validated)

    return c.json({ plan })
  } catch (error) {
    console.error('[Admin Points] Failed to update plan:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update plan' },
      400
    )
  }
})

/**
 * DELETE /api/v1/admin/points/plans/:id
 * ポイントプラン削除
 */
adminPointsRoutes.delete('/plans/:id', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const planId = c.req.param('id')

    await deletePlan(supabase, planId)

    return c.json({ success: true })
  } catch (error) {
    console.error('[Admin Points] Failed to delete plan:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to delete plan' },
      500
    )
  }
})

/**
 * GET /api/v1/admin/points/settings
 * システム設定取得
 */
adminPointsRoutes.get('/settings', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    // システム設定を取得（points_settings テーブルは1レコードのみ）
    const { data: settings, error } = await supabase
      .from('points_settings')
      .select('*')
      .single()

    if (error) {
      console.error('[Admin Points] Settings fetch error:', error)
      // 設定が存在しない場合はデフォルト値を返す
      return c.json({
        settings: {
          default_viewing_point_cost: 10,
          allow_negative_balance: false,
        },
      })
    }

    return c.json({ settings })
  } catch (error) {
    console.error('[Admin Points] Failed to get settings:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      500
    )
  }
})

/**
 * PATCH /api/v1/admin/points/settings
 * システム設定更新
 */
adminPointsRoutes.patch('/settings', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const body = await c.req.json()
    const validated = updatePointsSettingsSchema.parse(body)

    await updateSettings(supabase, validated)

    return c.json({ success: true })
  } catch (error) {
    console.error('[Admin Points] Failed to update settings:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      400
    )
  }
})

/**
 * GET /api/v1/admin/points/genre-costs
 * ジャンル別単価一覧取得
 */
adminPointsRoutes.get('/genre-costs', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const genres = await getGenreCosts(supabase)

    return c.json({ genres })
  } catch (error) {
    console.error('[Admin Points] Failed to get genre costs:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get genre costs' },
      500
    )
  }
})

/**
 * PATCH /api/v1/admin/points/genre-costs/:id
 * ジャンル別単価更新
 */
adminPointsRoutes.patch('/genre-costs/:id', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const genreId = c.req.param('id')

    const body = await c.req.json()
    const validated = updateGenreCostSchema.parse(body)

    await updateGenreCost(supabase, genreId, validated.viewing_point_cost)

    return c.json({ success: true })
  } catch (error) {
    console.error('[Admin Points] Failed to update genre cost:', error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update genre cost',
      },
      400
    )
  }
})

export default adminPointsRoutes
