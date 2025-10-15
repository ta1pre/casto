/**
 * 応募者向けオーディションAPI
 * [SF][CA] 公開オーディション閲覧
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import {
  getPublishedAuditions,
  getPublishedAuditionById,
} from './service'

const talentAuditionRoutes = new Hono<AppBindings>()

/**
 * 公開オーディション一覧取得
 * GET /api/v1/talent/auditions
 */
talentAuditionRoutes.get('/', async (c) => {
  try {
    const projectType = c.req.query('projectType')
    const genreIds = c.req.query('genreIds')?.split(',').filter(Boolean)
    const search = c.req.query('search')
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1
    const perPage = c.req.query('perPage') ? parseInt(c.req.query('perPage')!) : 20

    const supabase = createSupabaseClient(c)
    const result = await getPublishedAuditions(supabase, {
      projectType,
      genreIds,
      search,
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
 * 公開オーディション詳細取得
 * GET /api/v1/talent/auditions/:id
 */
talentAuditionRoutes.get('/:id', async (c) => {
  try {
    const auditionId = c.req.param('id')

    const supabase = createSupabaseClient(c)
    const audition = await getPublishedAuditionById(supabase, auditionId)

    if (!audition) {
      return c.json({ error: 'Audition not found or not published' }, 404)
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

export default talentAuditionRoutes
