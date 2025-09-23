import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

type Bindings = {
  JWT_SECRET?: string
  DATABASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  LINE_CHANNEL_SECRET?: string
  STRIPE_SECRET_KEY?: string
  ENVIRONMENT?: string
  CACHE?: KVNamespace
  NOTIFICATION_QUEUE?: Queue
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('*', cors({
  origin: '*', // 開発段階では全て許可
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: false, // credentialsをfalseに変更
}))

// Supabaseクライアント作成ヘルパー
function createSupabaseClient(c: any) {
  const supabaseUrl = c.env?.SUPABASE_URL
  const supabaseKey = c.env?.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// Health Check
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development'
  })
})

// Users API
app.get('/api/v1/users', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        user_handles (
          provider,
          handle,
          verified_at
        ),
        user_roles (
          role,
          granted_at
        )
      `)
      .eq('status', 'active')
      .limit(10)
    
    if (error) {
      return c.json({ error: error.message }, 500)
    }
    
    return c.json({
      users: data,
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Create User
app.post('/api/v1/users', async (c) => {
  try {
    const body = await c.req.json()
    const { provider, handle, role = 'applicant' } = body
    
    if (!provider || !handle) {
      return c.json({ error: 'provider and handle are required' }, 400)
    }
    
    const supabase = createSupabaseClient(c)
    
    // トランザクション的にユーザーを作成
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        status: 'active',
        flags: {}
      })
      .select()
      .single()
    
    if (userError) {
      return c.json({ error: userError.message }, 500)
    }
    
    // 認証情報を追加
    const { error: handleError } = await supabase
      .from('user_handles')
      .insert({
        user_id: user.id,
        provider,
        handle,
        verified_at: new Date().toISOString()
      })
    
    if (handleError) {
      return c.json({ error: handleError.message }, 500)
    }
    
    // ロールを追加
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role
      })
    
    if (roleError) {
      return c.json({ error: roleError.message }, 500)
    }
    
    return c.json({
      user: {
        id: user.id,
        created_at: user.created_at,
        status: user.status,
        provider,
        handle,
        role
      }
    }, 201)
  } catch (error) {
    return c.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get User by ID
app.get('/api/v1/users/:id', async (c) => {
  try {
    const userId = c.req.param('id')
    const supabase = createSupabaseClient(c)
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        created_at,
        updated_at,
        status,
        user_handles (
          provider,
          handle,
          verified_at
        ),
        user_roles (
          role,
          granted_at
        )
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

// 認証エンドポイント
app.post('/api/v1/auth/line/verify', async (c) => {
  // TODO: LINE IDトークン検証実装
  return c.json({ message: 'LINE auth endpoint - TODO' })
})

app.post('/api/v1/auth/email/request', async (c) => {
  // TODO: Magic Link送信実装
  return c.json({ message: 'Email auth request endpoint - TODO' })
})

app.post('/api/v1/auth/email/verify', async (c) => {
  // TODO: Magic Link検証実装
  return c.json({ message: 'Email auth verify endpoint - TODO' })
})

// オーディション関連
app.get('/api/v1/auditions/:id', async (c) => {
  const id = c.req.param('id')
  // TODO: オーディション情報取得実装
  return c.json({ message: `Audition ${id} - TODO` })
})

app.post('/api/v1/auditions/:id/entries', async (c) => {
  const id = c.req.param('id')
  // TODO: 応募作成実装
  return c.json({ message: `Entry for audition ${id} - TODO` })
})

// 主催者向け
app.get('/api/v1/organizer/auditions/:id/entries', async (c) => {
  const id = c.req.param('id')
  // TODO: 応募者一覧取得実装
  return c.json({ message: `Entries for audition ${id} - TODO` })
})

// ファイルアップロード
app.post('/api/v1/uploads/sign', async (c) => {
  // TODO: R2署名URL発行実装
  return c.json({ message: 'Upload sign endpoint - TODO' })
})

// Webhook
app.post('/api/v1/webhooks/line', async (c) => {
  // TODO: LINE Webhook処理実装
  return c.json({ message: 'LINE webhook - TODO' })
})

app.post('/api/v1/webhooks/stripe', async (c) => {
  // TODO: Stripe Webhook処理実装
  return c.json({ message: 'Stripe webhook - TODO' })
})

// 404ハンドラー
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// エラーハンドラー
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
