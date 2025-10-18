/**
 * 応募者向け応募API
 * [SF][CA][REH] 応募送信・一覧・辞退
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyAuth } from '../../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  submitApplication,
  getMyApplications,
  getMyApplicationById,
  withdrawApplication,
} from './service'
import { submitApplicationSchema } from '@casto/shared/validators'
import type { CreateApplicationRequest } from '@casto/shared'
import { createNotification } from '../../../lib/notification.service'

const talentApplicationRoutes = new Hono<AppBindings>()

/**
 * 応募送信
 * POST /api/v1/talent/applications
 */
talentApplicationRoutes.post('/', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json<CreateApplicationRequest>()

    // バリデーション
    const validation = submitApplicationSchema.safeParse(body)
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
    const application = await submitApplication(
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

    return c.json(
      {
        status: 'ok',
        application,
        message: 'Application submitted successfully',
      },
      201
    )
  } catch (error) {
    console.error('Failed to submit application:', error)
    
    // エラーメッセージの処理
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('already applied') ? 409 :
                       errorMessage.includes('not found') ? 404 :
                       errorMessage.includes('deadline') ? 400 : 500

    return c.json(
      {
        error: 'Failed to submit application',
        details: errorMessage,
      },
      statusCode
    )
  }
})

/**
 * 自分の応募一覧取得
 * GET /api/v1/talent/applications
 */
talentApplicationRoutes.get('/', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const status = c.req.query('status')
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1
    const perPage = c.req.query('perPage') ? parseInt(c.req.query('perPage')!) : 20

    const supabase = createSupabaseClient(c)
    const result = await getMyApplications(supabase, userContext.id, {
      status,
      page,
      perPage,
    })

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
 * 自分の応募詳細取得
 * GET /api/v1/talent/applications/:id
 */
talentApplicationRoutes.get('/:id', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const applicationId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    const application = await getMyApplicationById(
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
 * 応募辞退
 * PATCH /api/v1/talent/applications/:id/withdraw
 */
talentApplicationRoutes.patch('/:id/withdraw', verifyAuth, async (c) => {
  try {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const applicationId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    const application = await withdrawApplication(
      supabase,
      applicationId,
      userContext.id
    )

    return c.json({
      status: 'ok',
      application,
      message: 'Application withdrawn successfully',
    })
  } catch (error) {
    console.error('Failed to withdraw application:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('not found') ? 404 :
                       errorMessage.includes('Only submitted') ? 400 : 500

    return c.json(
      {
        error: 'Failed to withdraw application',
        details: errorMessage,
      },
      statusCode
    )
  }
})

export default talentApplicationRoutes
