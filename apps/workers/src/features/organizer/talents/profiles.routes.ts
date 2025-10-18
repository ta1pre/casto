/**
 * タレントプロフィールAPI（主催者側）
 * [SF][CA][REH] プロフィール閲覧
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import { getTalentProfile } from './profiles.service'

const profilesRoutes = new Hono<AppBindings>()

/**
 * タレントプロフィール詳細取得
 * GET /api/v1/organizer/talents/:talentId/profile
 */
profilesRoutes.get('/:talentId/profile', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const talentId = c.req.param('talentId')
    const supabase = createSupabaseClient(c)

    const profile = await getTalentProfile(supabase, talentId)
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }

    return c.json({
      status: 'ok',
      profile,
    })
  } catch (error) {
    console.error('Failed to fetch talent profile:', error)
    return c.json(
      {
        error: 'Failed to fetch talent profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default profilesRoutes
