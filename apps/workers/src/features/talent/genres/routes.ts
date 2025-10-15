/**
 * 応募者向けジャンルマスタAPI
 * [SF][CA] ジャンル一覧取得
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { getActiveGenres } from '../../organizer/auditions/genres.service'

const talentGenreRoutes = new Hono<AppBindings>()

/**
 * ジャンル一覧取得
 * GET /api/v1/talent/genres
 */
talentGenreRoutes.get('/', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const genres = await getActiveGenres(supabase)

    return c.json({
      status: 'ok',
      genres,
      total: genres.length,
    })
  } catch (error) {
    console.error('Failed to fetch genres:', error)
    return c.json(
      {
        error: 'Failed to fetch genres',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default talentGenreRoutes
