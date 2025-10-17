/**
 * オーディションステップAPI
 * [SF][CA][REH] ステップCRUD操作
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getAuditionSteps,
  createAuditionStep,
  updateAuditionStep,
  deleteAuditionStep,
} from './steps.service'
import { getAuditionById } from './service'
import {
  createAuditionStepSchema,
  updateAuditionStepSchema,
} from '@casto/shared/validators'
import type {
  CreateAuditionStepRequest,
  UpdateAuditionStepRequest,
} from '@casto/shared'

const stepsRoutes = new Hono<AppBindings>()

/**
 * ステップ一覧取得
 * GET /api/v1/organizer/auditions/:id/steps
 */
stepsRoutes.get('/:id/steps', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    
    // オーディション所有確認
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    const steps = await getAuditionSteps(supabase, auditionId)

    return c.json({
      status: 'ok',
      steps,
    })
  } catch (error) {
    console.error('Failed to fetch steps:', error)
    return c.json(
      {
        error: 'Failed to fetch steps',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * ステップ作成
 * POST /api/v1/organizer/auditions/:id/steps
 */
stepsRoutes.post('/:id/steps', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const body = await c.req.json<CreateAuditionStepRequest>()

    // バリデーション
    const validation = createAuditionStepSchema.safeParse(body)
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
    
    // オーディション所有確認と公開後チェック
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    if (audition.status === 'published') {
      return c.json(
        { error: 'Cannot add steps to published audition' },
        400
      )
    }

    const step = await createAuditionStep(supabase, auditionId, validation.data)

    return c.json({
      status: 'ok',
      step,
    }, 201)
  } catch (error) {
    console.error('Failed to create step:', error)
    return c.json(
      {
        error: 'Failed to create step',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * ステップ更新
 * PATCH /api/v1/organizer/auditions/:id/steps/:stepId
 */
stepsRoutes.patch('/:id/steps/:stepId', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const stepId = c.req.param('stepId')
    const body = await c.req.json<UpdateAuditionStepRequest>()

    // バリデーション
    const validation = updateAuditionStepSchema.safeParse(body)
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
    
    // オーディション所有確認と公開後チェック
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    if (audition.status === 'published') {
      return c.json(
        { error: 'Cannot update steps of published audition' },
        400
      )
    }

    const step = await updateAuditionStep(
      supabase,
      stepId,
      auditionId,
      validation.data
    )

    return c.json({
      status: 'ok',
      step,
    })
  } catch (error) {
    console.error('Failed to update step:', error)
    return c.json(
      {
        error: 'Failed to update step',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * ステップ削除
 * DELETE /api/v1/organizer/auditions/:id/steps/:stepId
 */
stepsRoutes.delete('/:id/steps/:stepId', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const stepId = c.req.param('stepId')

    const supabase = createSupabaseClient(c)
    
    // オーディション所有確認と公開後チェック
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    if (audition.status === 'published') {
      return c.json(
        { error: 'Cannot delete steps from published audition' },
        400
      )
    }

    await deleteAuditionStep(supabase, stepId, auditionId)

    return c.json({
      status: 'ok',
      message: 'Step deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete step:', error)
    return c.json(
      {
        error: 'Failed to delete step',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default stepsRoutes
