import { Hono } from 'hono'
import { createSupabaseClient } from '../../lib/supabase'
import type { AppBindings } from '../../types'
import {
  buildUsersListResponse,
  serializeUserResponse,
  type SupabaseUserRow,
  type UserUpsertRequest,
  type UserUpsertResponse
} from '@casto/shared'

const usersRoutes = new Hono<AppBindings>()

usersRoutes.get('/users', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[UsersAPI] Failed to fetch users:', error)
      return c.json({
        error: 'Failed to fetch users',
        details: error.message
      }, 500)
    }

    const users = (data ?? []) as SupabaseUserRow[]

    return c.json(buildUsersListResponse(users))
  } catch (error) {
    console.error('[UsersAPI] Unexpected error:', error)
    return c.json({
      error: 'Unexpected error while fetching users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

usersRoutes.post('/users', async (c) => {
  try {
    const payload = await c.req.json<UserUpsertRequest>()

    const provider = payload?.provider
    const handle = payload?.handle?.trim()
    const role = payload?.role?.trim() || 'applicant'

    if (!provider || !handle) {
      return c.json({
        error: 'provider と handle は必須です'
      }, 400)
    }

    if (!['email', 'line'].includes(provider)) {
      return c.json({
        error: 'provider は email か line を指定してください'
      }, 400)
    }

    const supabase = createSupabaseClient(c)

    const upsertPayload: Record<string, unknown> = {
      role,
      is_active: true,
      auth_provider: provider,
      token_version: 0
    }

    if (provider === 'email') {
      const normalizedEmail = handle.toLowerCase()
      upsertPayload.email = normalizedEmail
      upsertPayload.display_name = normalizedEmail
    } else {
      upsertPayload.line_user_id = handle
      upsertPayload.display_name = handle
    }

    const onConflict = provider === 'email' ? 'email' : 'line_user_id'

    const { data, error } = await supabase
      .from('users')
      .upsert(upsertPayload, {
        onConflict,
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (error) {
      console.error('[UsersAPI] Failed to upsert user:', error)
      return c.json({
        error: 'ユーザーの作成に失敗しました',
        details: error.message
      }, 500)
    }

    const insertedUser = data as SupabaseUserRow

    const responseBody: UserUpsertResponse = {
      status: 'ok',
      user: serializeUserResponse(insertedUser),
      processedAt: new Date().toISOString()
    }

    return c.json(responseBody, 201)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return c.json({
        error: 'JSON形式が不正です'
      }, 400)
    }

    console.error('[UsersAPI] Unexpected error on POST /users:', error)
    return c.json({
      error: 'Unexpected error while creating user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default usersRoutes
