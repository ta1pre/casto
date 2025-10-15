/**
 * 主催者向けオーディションAPI
 * [SF][CA][REH] オーディションCRUD操作
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getOrganizerAuditions,
  getAuditionById,
  createAudition,
  updateAudition,
  deleteAudition,
} from './service'
import {
  createAuditionSchema,
  updateAuditionSchema,
} from '@casto/shared/validators'
import type {
  CreateAuditionRequest,
  UpdateAuditionRequest,
} from '@casto/shared'

const auditionRoutes = new Hono<AppBindings>()

/**
 * オーディション一覧取得
 * GET /api/v1/organizer/auditions
 */
auditionRoutes.get('/', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const status = c.req.query('status')
    const projectType = c.req.query('projectType')
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1
    const perPage = c.req.query('perPage') ? parseInt(c.req.query('perPage')!) : 20

    const supabase = createSupabaseClient(c)
    const result = await getOrganizerAuditions(supabase, userContext.id, {
      status,
      projectType,
      page,
      perPage,
    })

    return c.json({
      status: 'ok',
      auditions: result.auditions,
      total: result.total,
      page,
      perPage,
    })
  } catch (error) {
    console.error('Failed to fetch auditions:', error)
    return c.json(
      {
        error: 'Failed to fetch auditions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * オーディション詳細取得
 * GET /api/v1/organizer/auditions/:id
 */
auditionRoutes.get('/:id', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    const audition = await getAuditionById(supabase, auditionId, userContext.id)

    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    return c.json({
      status: 'ok',
      audition,
    })
  } catch (error) {
    console.error('Failed to fetch audition:', error)
    return c.json(
      {
        error: 'Failed to fetch audition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * オーディション作成
 * POST /api/v1/organizer/auditions
 */
auditionRoutes.post('/', verifyOrganizerAuth, async (c) => {
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
    const audition = await createAudition(supabase, userContext.id, validation.data)

    return c.json({
      status: 'ok',
      audition,
      createdAt: new Date().toISOString(),
    }, 201)
  } catch (error) {
    console.error('Failed to create audition:', error)
    return c.json(
      {
        error: 'Failed to create audition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * オーディション更新
 * PATCH /api/v1/organizer/auditions/:id
 */
auditionRoutes.patch('/:id', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const body = await c.req.json<UpdateAuditionRequest>()

    // バリデーション
    const validation = updateAuditionSchema.safeParse(body)
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
    const audition = await updateAudition(
      supabase,
      auditionId,
      userContext.id,
      validation.data
    )

    return c.json({
      status: 'ok',
      audition,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to update audition:', error)
    return c.json(
      {
        error: 'Failed to update audition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * オーディション削除
 * DELETE /api/v1/organizer/auditions/:id
 */
auditionRoutes.delete('/:id', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    await deleteAudition(supabase, auditionId, userContext.id)

    return c.json({
      status: 'ok',
      message: 'Audition deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete audition:', error)
    return c.json(
      {
        error: 'Failed to delete audition',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default auditionRoutes
