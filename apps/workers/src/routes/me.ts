import { Hono } from 'hono'
import { createSupabaseClient } from '../lib/supabase'
import type { AppBindings } from '../types'

const meRoutes = new Hono<AppBindings>()

meRoutes.get('/users/me/profile-status', async (c) => {
  try {
    const sessionUser = c.get('user')

    if (!sessionUser) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)

    const { data: profile, error } = await supabase
      .from('applicant_profiles')
      .select('nickname, birthdate, profile_completed_at')
      .eq('user_id', sessionUser.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const missingFields: string[] = []

    if (!profile?.nickname) {
      missingFields.push('nickname')
    }
    if (!profile?.birthdate) {
      missingFields.push('birthdate')
    }

    const isComplete = missingFields.length === 0
    const totalFields = 2
    const completedFields = totalFields - missingFields.length
    const completionRate = Math.round((completedFields / totalFields) * 100)

    return c.json({
      isComplete,
      missingFields,
      completionRate,
      profile: profile || null
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch profile status' }, 500)
  }
})

meRoutes.post('/users/me/history', async (c) => {
  try {
    const sessionUser = c.get('user')

    if (!sessionUser) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json<{ auditionId: string; action?: string }>()
    const supabase = createSupabaseClient(c)

    const { error } = await supabase
      .from('viewing_history')
      .upsert({
        user_id: sessionUser.id,
        audition_id: body.auditionId,
        action: body.action || 'view',
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,audition_id'
      })

    if (error) {
      throw error
    }

    return c.json({ ok: true })
  } catch (error) {
    return c.json({ error: 'Failed to save history' }, 500)
  }
})

meRoutes.get('/users/me/recent-auditions', async (c) => {
  try {
    const sessionUser = c.get('user')

    if (!sessionUser) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)

    const { data, error } = await supabase
      .from('viewing_history')
      .select('audition_id, viewed_at, action')
      .eq('user_id', sessionUser.id)
      .order('viewed_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return c.json({
      auditions: data || [],
      message: 'Audition details will be added when auditions table is implemented'
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch recent auditions' }, 500)
  }
})

export default meRoutes
