/**
 * オーディション応募API（主催者側）
 * [SF][CA][REH] 応募者管理
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getAuditionApplications,
  getApplicationById,
  updateApplicationStatus,
} from './applications.service'
import { getAuditionById } from './service'
import { updateAuditionApplicationSchema } from '@casto/shared/validators'
import type { UpdateAuditionApplicationRequest } from '@casto/shared'

const applicationsRoutes = new Hono<AppBindings>()

/**
 * オーディションの応募一覧取得
 * GET /api/v1/organizer/auditions/:id/applications
 */
applicationsRoutes.get('/:id/applications', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const status = c.req.query('status')
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : undefined
    const perPage = c.req.query('perPage') ? parseInt(c.req.query('perPage')!) : undefined

    const supabase = createSupabaseClient(c)
    
    // オーディション所有確認
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    const result = await getAuditionApplications(supabase, auditionId, {
      status,
      page,
      perPage,
    })

    return c.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    return c.json(
      {
        error: 'Failed to fetch applications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 応募詳細取得
 * GET /api/v1/organizer/auditions/:id/applications/:applicationId
 */
applicationsRoutes.get('/:id/applications/:applicationId', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const applicationId = c.req.param('applicationId')

    const supabase = createSupabaseClient(c)
    
    // オーディション所有確認
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    const application = await getApplicationById(supabase, applicationId, auditionId)
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }

    return c.json({
      status: 'ok',
      application,
    })
  } catch (error) {
    console.error('Failed to fetch application:', error)
    return c.json(
      {
        error: 'Failed to fetch application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 応募ステータス更新
 * PATCH /api/v1/organizer/auditions/:id/applications/:applicationId
 */
applicationsRoutes.patch('/:id/applications/:applicationId', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const applicationId = c.req.param('applicationId')
    const body = await c.req.json<UpdateAuditionApplicationRequest>()

    // バリデーション
    const validation = updateAuditionApplicationSchema.safeParse(body)
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
    
    // オーディション所有確認
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    const application = await updateApplicationStatus(
      supabase,
      applicationId,
      auditionId,
      validation.data
    )

    return c.json({
      status: 'ok',
      application,
    })
  } catch (error) {
    console.error('Failed to update application:', error)
    return c.json(
      {
        error: 'Failed to update application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default applicationsRoutes
