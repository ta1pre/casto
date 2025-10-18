/**
 * タレント応募API（ステップ対応版）
 * [SF][CA][REH] 応募作成・管理
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getTalentApplications,
  getTalentApplicationById,
  createTalentApplication,
  withdrawTalentApplication,
} from './applications.service'
import { createAuditionApplicationSchema } from '@casto/shared/validators'
import type { CreateAuditionApplicationRequest } from '@casto/shared'
import { createNotification } from '../../../lib/notification.service'

const talentApplicationsRoutes = new Hono<AppBindings>()

/**
 * タレントの応募一覧取得
 * GET /api/v1/talent/audition-applications
 */
talentApplicationsRoutes.get('/', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const status = c.req.query('status')
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : undefined
    const perPage = c.req.query('perPage') ? parseInt(c.req.query('perPage')!) : undefined

    const supabase = createSupabaseClient(c)
    
    const result = await getTalentApplications(supabase, userContext.id, {
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
 * GET /api/v1/talent/audition-applications/:id
 */
talentApplicationsRoutes.get('/:id', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const applicationId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    
    const application = await getTalentApplicationById(supabase, applicationId, userContext.id)
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
 * 応募作成
 * POST /api/v1/talent/audition-applications
 */
talentApplicationsRoutes.post('/', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json<CreateAuditionApplicationRequest>()

    // バリデーション
    const validation = createAuditionApplicationSchema.safeParse(body)
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
    
    const application = await createTalentApplication(
      supabase,
      userContext.id,
      validation.data
    )

    // オーディション情報を取得（通知用）
    const { data: audition } = await supabase
      .from('auditions')
      .select('title')
      .eq('id', validation.data.auditionId)
      .single()

    // 応募完了通知を送信（LIFFアクセストークンがある場合）
    const liffAccessToken = body.liffAccessToken
    console.log('[Application] liffAccessToken present:', !!liffAccessToken)
    console.log('[Application] liffAccessToken length:', liffAccessToken?.length)
    console.log('[Application] audition data:', !!audition)
    
    if (liffAccessToken && audition) {
      console.log('[Application] Attempting to send notification...')
      try {
        await createNotification(
          {
            userId: userContext.id,
            type: 'application_received',
            context: {
              auditionTitle: audition.title,
              applicationId: application.id,
            },
            referenceType: 'application',
            referenceId: application.id,
            liffAccessToken,
          },
          supabase,
          c.env
        )
        console.log('[Application] Notification sent successfully')
      } catch (notifError) {
        // 通知送信失敗はエラーとしない（応募自体は成功）
        console.error('[Application] Failed to send notification:', notifError)
      }
    } else {
      console.log('[Application] Skipping notification - liffAccessToken:', !!liffAccessToken, 'audition:', !!audition)
    }

    return c.json({
      status: 'ok',
      application,
    }, 201)
  } catch (error) {
    console.error('Failed to create application:', error)
    return c.json(
      {
        error: 'Failed to create application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

/**
 * 応募取り下げ
 * PATCH /api/v1/talent/audition-applications/:id/withdraw
 */
talentApplicationsRoutes.patch('/:id/withdraw', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const applicationId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    
    const application = await withdrawTalentApplication(
      supabase,
      applicationId,
      userContext.id
    )

    return c.json({
      status: 'ok',
      application,
    })
  } catch (error) {
    console.error('Failed to withdraw application:', error)
    return c.json(
      {
        error: 'Failed to withdraw application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default talentApplicationsRoutes
