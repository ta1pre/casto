/**
 * Admin オーディション管理API ルート
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 * 
 * GET /api/v1/admin/auditions
 * GET /api/v1/admin/auditions/:id
 * POST /api/v1/admin/auditions
 * 
 * 注意: 管理者認証必須
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { verifyAdminAuth } from '../../../middleware/verifyRoleAuth'
import { getAuditions, getAuditionDetail } from './service'
import { createAudition } from '../../organizer/auditions/service'
import { getOrganizerProfile, createOrganizerProfile } from '../../organizer/profile/service'
import { createAuditionSchema } from '@casto/shared/validators'
import type { CreateAuditionRequest, OrganizerProfileUpsertRequest } from '@casto/shared'

const router = new Hono<AppBindings>()

const ADMIN_PROFILE_DEFAULTS: OrganizerProfileUpsertRequest = {
  name: 'Casto 管理チーム',
  prefecture: '東京都',
  addressDetail: '港区南青山1-1-1',
  phone: '03-0000-0000',
  description:
    'Casto管理チームによる代理公開用の主催者プロフィールです。各案件の品質管理と審査を担当し、プラットフォーム全体の体験向上を目的としています。',
  contactPerson: 'Casto管理チーム',
  email: 'admin@casto.jp',
  website: 'https://casto.jp',
  instagramUrl: null,
  xUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  logoUrl: null,
  logoPositionX: 0,
  logoPositionY: 0,
  logoScale: 1,
  isActive: false,
}

async function ensureAdminOrganizerProfile(supabase: ReturnType<typeof createSupabaseClient>, organizerId: string) {
  const existingProfile = await getOrganizerProfile(supabase, organizerId)
  if (existingProfile) {
    return existingProfile
  }

  return await createOrganizerProfile(supabase, organizerId, ADMIN_PROFILE_DEFAULTS)
}

// 全ルートに管理者認証を適用
router.use('/*', verifyAdminAuth)

/**
 * オーディション一覧取得
 * 
 * @route GET /api/v1/admin/auditions
 * @access Admin only
 */
router.get('/', async (c) => {
  try {
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

/**
 * オーディション作成
 * 
 * @route POST /api/v1/admin/auditions
 * @access Admin only
 */
router.post('/', async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json<CreateAuditionRequest>()

    // バリデーション
    const validation = createAuditionSchema.safeParse(body)
    if (!validation.success) {
      return c.json(
        {
          error: 'Validation failed',
          errors: validation.error.errors,
        },
        400
      )
    }

    const supabase = createSupabaseClient(c)
    await ensureAdminOrganizerProfile(supabase, userContext.id)
    // Admin作成者のIDをorganizer_idとして使用
    const audition = await createAudition(supabase, userContext.id, validation.data)

    return c.json({
      status: 'ok',
      audition,
      createdAt: new Date().toISOString(),
    }, 201)
  } catch (error) {
    console.error('[POST /admin/auditions] Error:', error)
    return c.json(
      {
        error: 'Failed to create audition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default router
