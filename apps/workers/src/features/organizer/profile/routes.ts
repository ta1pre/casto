/**
 * 主催者プロフィールAPI
 * [SF][CA][REH] プロフィールCRUD操作
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getOrganizerProfile,
  upsertOrganizerProfile,
} from './service'
import { validateOrganizerProfile } from '@casto/shared/validators'
import type { OrganizerProfileUpsertRequest } from '@casto/shared'

const organizerProfileRoutes = new Hono<AppBindings>()

/**
 * プロフィール取得
 * GET /api/v1/organizer/profile
 */
organizerProfileRoutes.get('/profile', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    const profile = await getOrganizerProfile(supabase, userContext.id)

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    return c.json({
      status: 'ok',
      profile,
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to fetch organizer profile:', error)
    return c.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * プロフィール作成・更新
 * PUT /api/v1/organizer/profile
 */
organizerProfileRoutes.put('/profile', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json<OrganizerProfileUpsertRequest>()

    // バリデーション
    const validation = validateOrganizerProfile(body)
    if (!validation.valid) {
      return c.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        400
      )
    }

    // プロフィール作成または更新
    const supabase = createSupabaseClient(c)
    const profile = await upsertOrganizerProfile(supabase, userContext.id, body)

    return c.json({
      status: 'ok',
      profile,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to upsert organizer profile:', error)
    return c.json(
      {
        error: 'Failed to save profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default organizerProfileRoutes
