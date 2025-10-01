import { Hono } from 'hono'
import { createSupabaseClient } from '../lib/supabase'
import type { AppBindings } from '../types'

const healthRoutes = new Hono<AppBindings>()

healthRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development'
  })
})

healthRoutes.get('/db-test', async (c) => {
  try {
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return c.json({
        success: false,
        error: 'Supabase credentials not configured',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          environment: c.env?.ENVIRONMENT || 'unknown'
        }
      }, 500)
    }

    const supabase = createSupabaseClient(c)

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      return c.json({
        success: false,
        error: 'Database query failed',
        details: error.message,
        debug: {
          supabaseUrl: supabaseUrl.substring(0, 30) + '...',
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint
        }
      }, 500)
    }

    return c.json({
      success: true,
      message: 'Database connection successful',
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        environment: c.env?.ENVIRONMENT || 'unknown'
      }
    }, 500)
  }
})

healthRoutes.get('/tables', async (c) => {
  try {
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return c.json({
        error: 'Supabase credentials not configured',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          environment: c.env?.ENVIRONMENT || 'unknown'
        }
      }, 500)
    }

    const supabase = createSupabaseClient(c)

    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')

    if (error) {
      return c.json({
        error: error.message,
        note: 'Could not access information_schema',
        debug: {
          supabaseUrl: supabaseUrl.substring(0, 30) + '...',
          errorCode: error.code,
          errorDetails: error.details
        }
      }, 500)
    }

    return c.json({
      tables: data,
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      error: 'Failed to get table list',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        environment: c.env?.ENVIRONMENT || 'unknown'
      }
    }, 500)
  }
})

healthRoutes.post('/create-table', async (c) => {
  try {
    const supabase = createSupabaseClient(c)

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        display_name: 'テストユーザー',
        role: 'applicant',
        auth_provider: 'email',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      return c.json({
        error: error.message,
        note: 'Failed to insert test data'
      }, 500)
    }

    return c.json({
      message: 'Test data inserted successfully',
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      error: 'Failed to create table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default healthRoutes
