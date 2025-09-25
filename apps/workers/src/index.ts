import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import { createAuthRoutes } from './routes/api/auth'
import { AuthMiddleware } from './middleware/auth'

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

// Database Connection Test
app.get('/api/v1/db-test', async (c) => {
  try {
    // 環境変数の確認
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 DB Test - Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPrefix: supabaseUrl?.substring(0, 30),
      environment: c.env?.ENVIRONMENT || 'unknown'
    })
    
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
    
    // 簡単なクエリでデータベース接続をテスト
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ DB Test - Query failed:', error)
      return c.json({ 
        success: false,
        error: 'Database query failed',
        details: error.message,
        debug: {
          supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint
        }
      }, 500)
    }
    
    console.log('✅ DB Test - Success:', data)
    return c.json({
      success: true,
      message: 'Database connection successful',
      data: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('💥 DB Test - Exception:', error)
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

// Check existing tables
app.get('/api/v1/tables', async (c) => {
  try {
    // 環境変数の確認
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
    
    // Try to get table list from information_schema
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
          supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
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

// Create simple users table via Supabase client
app.post('/api/v1/create-table', async (c) => {
  try {
    const supabase = createSupabaseClient(c)
    
    // Try to insert a test record to create the table structure
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

// Users API - 既存テーブル構造に対応
app.get('/api/v1/users', async (c) => {
  try {
    // 環境変数の確認
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
    
    // まず既存のテーブル構造を確認
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (error) {
      return c.json({ 
        error: error.message,
        note: 'Trying to access existing table structure',
        debug: {
          supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
          errorCode: error.code,
          errorDetails: error.details
        },
        timestamp: new Date().toISOString()
      }, 500)
    }
    
    return c.json({
      users: data,
      count: data?.length || 0,
      table_structure: data.length > 0 ? Object.keys(data[0]) : [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        environment: c.env?.ENVIRONMENT || 'unknown'
      }
    }, 500)
  }
})

// Create User - 最小限のユーザーテーブル対応
app.post('/api/v1/users', async (c) => {
  try {
    const body = await c.req.json()
    const { provider, handle, role = 'applicant' } = body
    
    if (!provider || !handle) {
      return c.json({ error: 'provider and handle are required' }, 400)
    }
    
    const supabase = createSupabaseClient(c)
    
    // ユーザーデータ準備
    const userData: any = {
      display_name: handle, // とりあえずhandleを表示名として使用
      role,
      auth_provider: provider,
      is_active: true
    }
    
    // プロバイダーに応じて認証情報を設定
    if (provider === 'email') {
      userData.email = handle
    } else if (provider === 'line') {
      userData.line_user_id = handle
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (userError) {
      return c.json({ error: userError.message }, 500)
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        line_user_id: user.line_user_id,
        display_name: user.display_name,
        role: user.role,
        auth_provider: user.auth_provider,
        created_at: user.created_at
      }
    }, 201)
  } catch (error) {
    return c.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get User by ID - 最小限のユーザーテーブル対応
app.get('/api/v1/users/:id', async (c) => {
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

// 認証APIルートの直接定義
app.post('/api/auth/login', async (c) => {
  // TODO: 認証処理実装
  return c.json({ message: 'Auth login endpoint - TODO' })
})

app.get('/api/auth/session', async (c) => {
  // TODO: セッション取得処理実装
  return c.json({ message: 'Auth session endpoint - TODO' })
})

app.post('/api/auth/logout', async (c) => {
  // TODO: ログアウト処理実装
  return c.json({ message: 'Auth logout endpoint - TODO' })
})

app.post('/api/auth/refresh', async (c) => {
  // TODO: セッション更新処理実装
  return c.json({ message: 'Auth refresh endpoint - TODO' })
})

app.post('/api/auth/register', async (c) => {
  // TODO: ユーザー登録処理実装
  return c.json({ message: 'Auth register endpoint - TODO' })
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
