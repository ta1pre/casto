/**
 * オーディション種別API
 * [SF][CA] 種別マスタの取得・更新エンドポイント
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../types'
import { getAllAuditionTypes, getActiveAuditionTypes, updateAuditionType } from './service'
import { verifyAdminAuth } from '../../middleware/verifyRoleAuth'
import { createSupabaseClient } from '../../lib/supabase'

const app = new Hono<AppBindings>()

/**
 * GET /api/v1/audition-types
 * 有効な種別一覧を取得（認証不要）
 */
app.get('/', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const types = await getActiveAuditionTypes(supabase)
    
    return c.json(types, 200)
  } catch (error) {
    console.error('Failed to fetch audition types:', error)
    return c.json(
      { error: '種別の取得に失敗しました', details: error instanceof Error ? error.message : String(error) },
      500
    )
  }
})

/**
 * GET /api/v1/audition-types/all
 * 全種別を取得（管理者のみ）
 */
app.get('/all', verifyAdminAuth, async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const types = await getAllAuditionTypes(supabase)
    
    return c.json(types, 200)
  } catch (error) {
    console.error('Failed to fetch all audition types:', error)
    return c.json(
      { error: '種別の取得に失敗しました', details: error instanceof Error ? error.message : String(error) },
      500
    )
  }
})

/**
 * PATCH /api/v1/audition-types/:id
 * 種別を更新（管理者のみ）
 */
app.patch('/:id', verifyAdminAuth, async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const typeId = c.req.param('id')
    const updates = await c.req.json()
    
    const updatedType = await updateAuditionType(supabase, typeId, updates)
    
    return c.json({ type: updatedType }, 200)
  } catch (error) {
    console.error('Failed to update audition type:', error)
    return c.json(
      { error: '種別の更新に失敗しました', details: error instanceof Error ? error.message : String(error) },
      500
    )
  }
})

export default app
