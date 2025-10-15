/**
 * 主催者向け応募管理API
 * [SF][CA][REH] 応募一覧・詳細取得、ステータス更新
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getApplicationsByAudition,
  getApplicationById,
  updateApplicationStatus,
} from './service'

const applicationRoutes = new Hono<AppBindings>()

/**
 * オーディションへの応募一覧取得
 * GET /api/v1/organizer/auditions/:auditionId/applications
 */
applicationRoutes.get('/auditions/:auditionId/applications', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('auditionId')
    const status = c.req.query('status')
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1
    const perPage = c.req.query('perPage') ? parseInt(c.req.query('perPage')!) : 20

    const supabase = createSupabaseClient(c)
    const result = await getApplicationsByAudition(
      supabase,
      auditionId,
      userContext.id,
      {
        status,
        page,
        perPage,
      }
    )

    return c.json({
      status: 'ok',
      applications: result.applications,
      total: result.total,
      page,
      perPage,
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
 * GET /api/v1/organizer/applications/:id
 */
applicationRoutes.get('/applications/:id', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const applicationId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    const application = await getApplicationById(
      supabase,
      applicationId,
      userContext.id
    )

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
 * 応募ステータス更新（審査結果の反映）
 * PATCH /api/v1/organizer/applications/:id/status
 */
applicationRoutes.patch('/applications/:id/status', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const applicationId = c.req.param('id')
    const body = await c.req.json<{ status: string }>()

    if (!body.status) {
      return c.json({ error: 'Status is required' }, 400)
    }

    // ステータスの妥当性チェック
    const validStatuses = ['under_review', 'accepted', 'rejected']
    if (!validStatuses.includes(body.status)) {
      return c.json(
        {
          error: 'Invalid status',
          validStatuses,
        },
        400
      )
    }

    const supabase = createSupabaseClient(c)
    const application = await updateApplicationStatus(
      supabase,
      applicationId,
      userContext.id,
      body.status
    )

    return c.json({
      status: 'ok',
      application,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to update application status:', error)
    return c.json(
      {
        error: 'Failed to update application status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default applicationRoutes
