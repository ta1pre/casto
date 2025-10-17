/**
 * オーディション評価API（主催者側）
 * [SF][CA][REH] 評価管理
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getApplicationEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
} from './evaluations.service'
import { getAuditionById } from './service'
import { getApplicationById } from './applications.service'
import {
  createAuditionEvaluationSchema,
  updateAuditionEvaluationSchema,
} from '@casto/shared/validators'
import type {
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
} from '@casto/shared'

const evaluationsRoutes = new Hono<AppBindings>()

/**
 * 応募の評価一覧取得
 * GET /api/v1/organizer/auditions/:id/applications/:applicationId/evaluations
 */
evaluationsRoutes.get('/:id/applications/:applicationId/evaluations', verifyOrganizerAuth, async (c) => {
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

    // 応募確認
    const application = await getApplicationById(supabase, applicationId, auditionId)
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }

    const evaluations = await getApplicationEvaluations(supabase, applicationId)

    return c.json({
      status: 'ok',
      evaluations,
    })
  } catch (error) {
    console.error('Failed to fetch evaluations:', error)
    return c.json(
      {
        error: 'Failed to fetch evaluations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 評価作成
 * POST /api/v1/organizer/auditions/:id/applications/:applicationId/steps/:stepId/evaluation
 */
evaluationsRoutes.post('/:id/applications/:applicationId/steps/:stepId/evaluation', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const applicationId = c.req.param('applicationId')
    const stepId = c.req.param('stepId')
    const body = await c.req.json<CreateEvaluationRequest>()

    // バリデーション
    const validation = createAuditionEvaluationSchema.safeParse(body)
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

    // 応募確認
    const application = await getApplicationById(supabase, applicationId, auditionId)
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }

    const evaluation = await createEvaluation(
      supabase,
      applicationId,
      stepId,
      userContext.id,
      validation.data
    )

    return c.json({
      status: 'ok',
      evaluation,
    }, 201)
  } catch (error) {
    console.error('Failed to create evaluation:', error)
    return c.json(
      {
        error: 'Failed to create evaluation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 評価更新
 * PATCH /api/v1/organizer/auditions/:id/applications/:applicationId/evaluations/:evaluationId
 */
evaluationsRoutes.patch('/:id/applications/:applicationId/evaluations/:evaluationId', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const applicationId = c.req.param('applicationId')
    const evaluationId = c.req.param('evaluationId')
    const body = await c.req.json<UpdateEvaluationRequest>()

    // バリデーション
    const validation = updateAuditionEvaluationSchema.safeParse(body)
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

    const evaluation = await updateEvaluation(
      supabase,
      evaluationId,
      validation.data
    )

    return c.json({
      status: 'ok',
      evaluation,
    })
  } catch (error) {
    console.error('Failed to update evaluation:', error)
    return c.json(
      {
        error: 'Failed to update evaluation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 評価削除
 * DELETE /api/v1/organizer/auditions/:id/applications/:applicationId/evaluations/:evaluationId
 */
evaluationsRoutes.delete('/:id/applications/:applicationId/evaluations/:evaluationId', verifyOrganizerAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const auditionId = c.req.param('id')
    const evaluationId = c.req.param('evaluationId')

    const supabase = createSupabaseClient(c)
    
    // オーディション所有確認
    const audition = await getAuditionById(supabase, auditionId, userContext.id)
    if (!audition) {
      return c.json({ error: 'Audition not found' }, 404)
    }

    await deleteEvaluation(supabase, evaluationId)

    return c.json({
      status: 'ok',
      message: 'Evaluation deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete evaluation:', error)
    return c.json(
      {
        error: 'Failed to delete evaluation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default evaluationsRoutes
