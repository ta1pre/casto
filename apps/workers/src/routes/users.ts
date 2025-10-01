import { Hono } from 'hono'
import { createSupabaseClient } from '../lib/supabase'
import { serializeUserResponse } from '../lib/users'
import type { AppBindings } from '../types'

const usersRoutes = new Hono<AppBindings>()

usersRoutes.get('/users', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (error) {
      return c.json({
        error: error.message,
        note: 'Trying to access existing table structure'
      }, 500)
    }

    return c.json({
      users: data,
      count: data?.length || 0,
      table_structure: data?.length ? Object.keys(data[0] as Record<string, unknown>) : [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

usersRoutes.post('/users', async (c) => {
  try {
    const body = await c.req.json<{ provider?: string; handle?: string; role?: string }>()
    const { provider, handle, role = 'applicant' } = body

    if (!provider || !handle) {
      return c.json({ error: 'provider and handle are required' }, 400)
    }

    const supabase = createSupabaseClient(c)
    const userData: Record<string, unknown> = {
      display_name: handle,
      role,
      auth_provider: provider,
      is_active: true
    }

    if (provider === 'email') {
      userData.email = handle
    } else if (provider === 'line') {
      userData.line_user_id = handle
    }

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (insertError) {
      return c.json({ error: insertError.message }, 500)
    }

    return c.json({
      user: serializeUserResponse(user)
    }, 201)
  } catch (error) {
    return c.json({
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

usersRoutes.get('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id')
    const supabase = createSupabaseClient(c)

    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        line_user_id,
        display_name,
        role,
        auth_provider,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single()

    if (error) {
      return c.json({ error: error.message }, 404)
    }

    return c.json({ user: data })
  } catch (error) {
    return c.json({
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default usersRoutes
