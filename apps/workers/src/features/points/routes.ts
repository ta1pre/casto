/**
 * ポイント機能のAPIルート（主催者向け）
 * 
 * 設計原則: [SF][REH][CA]
 * - エラーハンドリング
 * - バリデーション
 * - 認証チェック
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../types'
import { createSupabaseClient } from '../../lib/supabase'
import {
  checkViewingRequestSchema,
  consumeViewingRequestSchema,
} from '@casto/shared'
import {
  getOrCreateAccount,
  getTransactions,
  getPointsPlans,
  checkViewingEligibility,
  consumeViewingPoints,
} from './service'

const pointsRoutes = new Hono<AppBindings>()

/**
 * GET /api/v1/points/account
 * ポイントアカウント取得
 */
pointsRoutes.get('/account', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const account = await getOrCreateAccount(supabase, { userId: user.id })

    return c.json({ account })
  } catch (error) {
    console.error('[Points] Failed to get account:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get account' },
      500
    )
  }
})

/**
 * GET /api/v1/points/transactions
 * 取引履歴取得
 */
pointsRoutes.get('/transactions', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // クエリパラメータ
    const limit = parseInt(c.req.query('limit') || '50', 10)
    const offset = parseInt(c.req.query('offset') || '0', 10)

    const result = await getTransactions(supabase, user.id, limit, offset)

    return c.json(result)
  } catch (error) {
    console.error('[Points] Failed to get transactions:', error)
    return c.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get transactions',
      },
      500
    )
  }
})

/**
 * GET /api/v1/points/plans
 * ポイントプラン一覧取得
 */
pointsRoutes.get('/plans', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const plans = await getPointsPlans(supabase)

    return c.json({ plans })
  } catch (error) {
    console.error('[Points] Failed to get plans:', error)
    return c.json(
      { error: error instanceof Error ? error.message : 'Failed to get plans' },
      500
    )
  }
})

/**
 * POST /api/v1/points/check-viewing
 * 閲覧可否チェック
 */
pointsRoutes.post('/check-viewing', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // バリデーション
    const body = await c.req.json()
    const validated = checkViewingRequestSchema.parse(body)

    const eligibility = await checkViewingEligibility(
      supabase,
      user.id,
      validated.applicationId
    )

    return c.json({ eligibility })
  } catch (error) {
    console.error('[Points] Failed to check viewing eligibility:', error)
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check viewing eligibility',
      },
      400
    )
  }
})

/**
 * POST /api/v1/points/consume-viewing
 * 閲覧ポイント消費
 */
pointsRoutes.post('/consume-viewing', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // バリデーション
    const body = await c.req.json()
    const validated = consumeViewingRequestSchema.parse(body)

    // 閲覧可否チェック
    const eligibility = await checkViewingEligibility(
      supabase,
      user.id,
      validated.applicationId
    )

    if (!eligibility.canView) {
      return c.json(
        { error: 'Cannot view', reason: eligibility.reason },
        403
      )
    }

    // application情報取得
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('audition_id')
      .eq('id', validated.applicationId)
      .single()

    if (appError || !application) {
      return c.json({ error: 'Application not found' }, 404)
    }

    // ポイント消費
    await consumeViewingPoints(supabase, {
      userId: user.id,
      applicationId: validated.applicationId,
      auditionId: application.audition_id,
      pointsConsumed: eligibility.pointsRequired,
    })

    return c.json({
      success: true,
      pointsConsumed: eligibility.pointsRequired,
    })
  } catch (error) {
    console.error('[Points] Failed to consume viewing points:', error)
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to consume viewing points',
      },
      500
    )
  }
})

export default pointsRoutes
