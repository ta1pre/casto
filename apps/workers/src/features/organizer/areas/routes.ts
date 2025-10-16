/**
 * 主催者向けエリアAPI
 * [SF][CA] エリア一覧取得
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { getAllAreas } from './service'

const organizerAreaRoutes = new Hono<AppBindings>()

/**
 * エリア一覧取得
 * GET /api/v1/organizer/areas
 */
organizerAreaRoutes.get('/', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const areas = await getAllAreas(supabase)

    return c.json({
      status: 'ok',
      areas,
    })
  } catch (error) {
    console.error('Failed to fetch areas:', error)
    return c.json(
      {
        error: 'Failed to fetch areas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    )
  }
})

export default organizerAreaRoutes
