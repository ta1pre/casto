/**
 * Admin表示ラベルAPIルート
 * [SF][CA][REH] Admin代理公開時のラベル管理API
 */

import { Hono } from 'hono'
import { z } from 'zod'
import type { AppBindings } from '../../../types'
import { createSupabaseClient } from '../../../lib/supabase'
import { verifyAdminAuth } from '../../../middleware/verifyRoleAuth'
import {
  getAdminDisplayLabels,
  getAdminDisplayLabel,
  createAdminDisplayLabel,
  updateAdminDisplayLabel,
  deleteAdminDisplayLabel,
  getActiveAdminDisplayLabels,
} from './service'
import type { 
  AdminDisplayLabelsResponse,
  CreateAdminDisplayLabelRequest,
  UpdateAdminDisplayLabelRequest 
} from '@casto/shared'

const router = new Hono<AppBindings>()

// 全ルートに管理者認証を適用
router.use('/*', verifyAdminAuth)

// バリデーションスキーマ
const createLabelSchema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
})

const updateLabelSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
})

const listQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  perPage: z.string().regex(/^\d+$/).optional(),
  isActive: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
})

/**
 * GET /api/v1/admin/labels
 * Admin表示ラベル一覧取得
 */
router.get('/', async (c) => {
  try {
    const query = listQuerySchema.safeParse(c.req.query())
    if (!query.success) {
      return c.json({ error: 'Invalid query parameters' }, 400)
    }
    
    const client = createSupabaseClient(c)

    const options = {
      page: query.data.page ? parseInt(query.data.page) : undefined,
      perPage: query.data.perPage ? parseInt(query.data.perPage) : undefined,
      isActive: query.data.isActive,
    }

    const result = await getAdminDisplayLabels(client, options)
    return c.json<AdminDisplayLabelsResponse>(result)
  } catch (error) {
    console.error('Error in GET /api/v1/admin/labels:', error)
    return c.json(
      { error: error instanceof Error ? error.message : '不明なエラーが発生しました' },
      500
    )
  }
})

/**
 * GET /api/v1/admin/labels/active
 * 有効なAdmin表示ラベル一覧取得（選択肢用）
 */
router.get('/active', async (c) => {
  try {
    const client = createSupabaseClient(c)
    const labels = await getActiveAdminDisplayLabels(client)
    return c.json({ labels })
  } catch (error) {
    console.error('Error in GET /api/v1/admin/labels/active:', error)
    return c.json(
      { error: error instanceof Error ? error.message : '不明なエラーが発生しました' },
      500
    )
  }
})

/**
 * GET /api/v1/admin/labels/:id
 * Admin表示ラベル単体取得
 */
router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const client = createSupabaseClient(c)

    const label = await getAdminDisplayLabel(client, id)
    if (!label) {
      return c.json({ error: '表示ラベルが見つかりません' }, 404)
    }

    return c.json({ label })
  } catch (error) {
    console.error('Error in GET /api/v1/admin/labels/:id:', error)
    return c.json(
      { error: error instanceof Error ? error.message : '不明なエラーが発生しました' },
      500
    )
  }
})

/**
 * POST /api/v1/admin/labels
 * Admin表示ラベル作成
 */
router.post('/', async (c) => {
  try {
    const body = createLabelSchema.safeParse(await c.req.json())
    if (!body.success) {
      return c.json({ error: 'Invalid request body' }, 400)
    }
    
    const data = body.data as CreateAdminDisplayLabelRequest
    const client = createSupabaseClient(c)

    const newLabel = await createAdminDisplayLabel(client, data)
    return c.json({ label: newLabel }, 201)
  } catch (error) {
    console.error('Error in POST /api/v1/admin/labels:', error)
    if (error instanceof Error) {
      if (error.message.includes('同じラベル名が既に存在します')) {
        return c.json({ error: error.message }, 409)
      }
    }
    return c.json(
      { error: error instanceof Error ? error.message : '不明なエラーが発生しました' },
      500
    )
  }
})

/**
 * PUT /api/v1/admin/labels/:id
 * Admin表示ラベル更新
 */
router.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = updateLabelSchema.safeParse(await c.req.json())
    if (!body.success) {
      return c.json({ error: 'Invalid request body' }, 400)
    }
    
    const data = body.data as UpdateAdminDisplayLabelRequest
    const client = createSupabaseClient(c)

    const updatedLabel = await updateAdminDisplayLabel(client, id, data)
    return c.json({ label: updatedLabel })
  } catch (error) {
    console.error('Error in PUT /api/v1/admin/labels/:id:', error)
    if (error instanceof Error) {
      if (error.message.includes('表示ラベルが見つかりません')) {
        return c.json({ error: error.message }, 404)
      }
      if (error.message.includes('同じラベル名が既に存在します')) {
        return c.json({ error: error.message }, 409)
      }
    }
    return c.json(
      { error: error instanceof Error ? error.message : '不明なエラーが発生しました' },
      500
    )
  }
})

/**
 * DELETE /api/v1/admin/labels/:id
 * Admin表示ラベル削除
 */
router.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const client = createSupabaseClient(c)

    await deleteAdminDisplayLabel(client, id)
    return c.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/v1/admin/labels/:id:', error)
    if (error instanceof Error) {
      if (error.message.includes('このラベルを使用しているオーディションがあるため削除できません')) {
        return c.json({ error: error.message }, 409)
      }
    }
    return c.json(
      { error: error instanceof Error ? error.message : '不明なエラーが発生しました' },
      500
    )
  }
})

export default router
