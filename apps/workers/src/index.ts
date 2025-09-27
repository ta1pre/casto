import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'
import type { Context } from 'hono'

import {
  getAuthCookie,
  verifyJWT,
  createJWT,
  setAuthCookie,
  clearAuthCookie
} from './lib/auth'
import type { TokenPayloadInput } from './lib/auth'

type Bindings = {
  JWT_SECRET?: string
  DATABASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  LINE_CHANNEL_SECRET?: string
  LINE_CHANNEL_ID?: string
  STRIPE_SECRET_KEY?: string
  ENVIRONMENT?: string
  CACHE?: KVNamespace
  NOTIFICATION_QUEUE?: Queue
}

type AppBindings = {
  Bindings: Bindings
  Variables: {
    user?: {
      id: string
      roles: string[]
      provider?: string
      tokenVersion?: number
    }
  }
}

const app = new Hono<AppBindings>()

async function attachUserContext(c: Context<AppBindings>, next: () => Promise<void>) {
  const token = getAuthCookie(c)
  if (!token) {
    await next()
    return
  }

  const jwtSecret = c.env?.JWT_SECRET
  if (!jwtSecret) {
    console.warn('JWT_SECRET is not configured')
    await next()
    return
  }

  try {
    const payload = await verifyJWT(token, jwtSecret)

    if (!payload.sub) {
      console.warn('JWT payload missing subject')
      await next()
      return
    }

    const roles = Array.isArray(payload.roles)
      ? payload.roles
      : typeof payload.roles === 'string'
        ? [payload.roles]
        : []

    c.set('user', {
      id: payload.sub,
      roles,
      provider: payload.provider,
      tokenVersion: payload.tokenVersion
    })
  } catch (error) {
    console.warn('JWT verification failed', error)
  }

  await next()
}

const DEFAULT_ALLOWED_ORIGIN = 'https://casto.sb2024.xyz'
const ADDITIONAL_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  DEFAULT_ALLOWED_ORIGIN
])

// CORS設定
app.use('*', cors({
  origin: (origin: string | undefined) => {
    if (!origin) {
      return DEFAULT_ALLOWED_ORIGIN
    }
    if (ADDITIONAL_ALLOWED_ORIGINS.has(origin)) {
      return origin
    }
    return DEFAULT_ALLOWED_ORIGIN
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use('*', attachUserContext)

// Supabaseクライアント作成ヘルパー
function createSupabaseClient(c: any) {
  const supabaseUrl = c.env?.SUPABASE_URL
  const supabaseKey = c.env?.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

type SupabaseUserRow = {
  id: string
  email?: string | null
  line_user_id?: string | null
  display_name?: string | null
  role?: string | null
  auth_provider?: string | null
  token_version?: number | null
  created_at?: string
  updated_at?: string
}

function mapRoles(role?: string | null): string[] {
  if (!role) {
    return []
  }
  return [role]
}

async function issueSession(c: Context<AppBindings>, user: SupabaseUserRow) {
  const jwtSecret = c.env?.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }

  const payload: TokenPayloadInput = {
    userId: user.id,
    roles: mapRoles(user.role),
    provider: (user.auth_provider as 'line' | 'email') ?? 'line',
    tokenVersion: user.token_version ?? 0
  }

  const token = await createJWT(payload, jwtSecret)
  setAuthCookie(c, token)

  return token
}

async function findUserByLineId(client: ReturnType<typeof createSupabaseClient>, lineUserId: string) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as SupabaseUserRow | null) ?? null
}

async function findUserById(client: ReturnType<typeof createSupabaseClient>, id: string) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as SupabaseUserRow | null) ?? null
}

async function findUserByEmail(client: ReturnType<typeof createSupabaseClient>, email: string) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as SupabaseUserRow | null) ?? null
}

async function upsertLineUser(
  client: ReturnType<typeof createSupabaseClient>,
  lineUserId: string,
  profile: { name?: string; picture?: string; email?: string | null }
) {
  const existing = await findUserByLineId(client, lineUserId)

  if (existing) {
    const { data, error } = await client
      .from('users')
      .update({
        display_name: profile.name ?? existing.display_name ?? 'LINEユーザー',
        auth_provider: 'line'
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as SupabaseUserRow
  }

  const { data, error } = await client
    .from('users')
    .insert({
      line_user_id: lineUserId,
      display_name: profile.name ?? 'LINEユーザー',
      auth_provider: 'line',
      role: 'applicant',
      email: profile.email?.toLowerCase() ?? null,
      token_version: 0
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as SupabaseUserRow
}

async function upsertEmailUser(
  client: ReturnType<typeof createSupabaseClient>,
  email: string,
  options: { displayName?: string; role?: string }
) {
  const normalizedEmail = email.toLowerCase()
  const existing = await findUserByEmail(client, normalizedEmail)

  if (existing) {
    const { data, error } = await client
      .from('users')
      .update({
        display_name: options.displayName ?? existing.display_name ?? normalizedEmail,
        auth_provider: 'email',
        role: options.role ?? existing.role ?? 'organizer'
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as SupabaseUserRow
  }

  const { data, error } = await client
    .from('users')
    .insert({
      email: normalizedEmail,
      display_name: options.displayName ?? normalizedEmail,
      auth_provider: 'email',
      role: options.role ?? 'organizer',
      token_version: 0
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as SupabaseUserRow
}

function serializeUserResponse(user: SupabaseUserRow) {
  return {
    id: user.id,
    email: user.email,
    lineUserId: user.line_user_id,
    displayName: user.display_name,
    role: user.role,
    provider: user.auth_provider,
    tokenVersion: user.token_version ?? 0,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }
}

async function verifyLineIdToken(idToken: string, channelId: string) {
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId
  })

  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LINE verify failed: ${response.status} ${errorText}`)
  }

  return response.json() as Promise<{
    sub: string
    name?: string
    email?: string
    picture?: string
  }>
}

function getMagicLinkKv(c: Context<AppBindings>) {
  const kv = c.env?.CACHE
  if (!kv) {
    throw new Error('CACHE KV namespace is not configured')
  }
  return kv
}

const MAGIC_LINK_TTL_SECONDS = 60 * 10

async function createMagicLinkToken(
  c: Context<AppBindings>,
  payload: { email: string; role?: string }
) {
  const token = crypto.randomUUID()
  const kv = getMagicLinkKv(c)
  const key = `magic_link:${token}`

  await kv.put(key, JSON.stringify(payload), { expirationTtl: MAGIC_LINK_TTL_SECONDS })

  return token
}

async function consumeMagicLinkToken(
  c: Context<AppBindings>,
  token: string
): Promise<{ email: string; role?: string } | null> {
  const kv = getMagicLinkKv(c)
  const key = `magic_link:${token}`
  const stored = await kv.get(key)

  if (!stored) {
    return null
  }

  await kv.delete(key)

  return JSON.parse(stored) as { email: string; role?: string }
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
  try {
    const body = await c.req.json<{ idToken?: string }>()
    const idToken = body?.idToken

    if (!idToken) {
      return c.json({ error: 'idToken is required' }, 400)
    }

    const channelId = c.env?.LINE_CHANNEL_ID
    if (!channelId) {
      console.error('LINE_CHANNEL_ID is not configured')
      return c.json({ error: 'LINE channel configuration missing' }, 500)
    }

    const tokenInfo = await verifyLineIdToken(idToken, channelId)
    const supabase = createSupabaseClient(c)

    const user = await upsertLineUser(supabase, tokenInfo.sub, {
      name: tokenInfo.name,
      email: tokenInfo.email ?? null,
      picture: tokenInfo.picture
    })

    await issueSession(c, user)

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    console.error('LINE auth verification failed', error)
    return c.json({ error: 'LINE authentication failed' }, 401)
  }
})

app.post('/api/v1/auth/email/request', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; role?: string; redirectUrl?: string }>()
    const email = body?.email?.trim()

    if (!email) {
      return c.json({ error: 'email is required' }, 400)
    }

    const token = await createMagicLinkToken(c, {
      email,
      role: body?.role
    })

    const redirectUrl = body?.redirectUrl
    const magicLinkUrl = redirectUrl ? `${redirectUrl}?token=${token}` : undefined

    // TODO: メール送信基盤を接続する（現状はトークンのみ返却）
    console.log('Magic link generated', { email, token, redirectUrl })

    return c.json({
      ok: true,
      token,
      magicLinkUrl
    })
  } catch (error) {
    console.error('Magic link request failed', error)
    return c.json({ error: 'Failed to create magic link' }, 500)
  }
})

app.post('/api/v1/auth/email/verify', async (c) => {
  try {
    const body = await c.req.json<{ token?: string }>()
    const token = body?.token

    if (!token) {
      return c.json({ error: 'token is required' }, 400)
    }

    const payload = await consumeMagicLinkToken(c, token)

    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 400)
    }

    const supabase = createSupabaseClient(c)
    const user = await upsertEmailUser(supabase, payload.email, {
      role: payload.role ?? 'organizer'
    })

    await issueSession(c, user)

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    console.error('Magic link verification failed', error)
    return c.json({ error: 'Failed to verify magic link' }, 500)
  }
})

app.post('/api/v1/auth/logout', (c) => {
  clearAuthCookie(c)
  return c.json({ ok: true })
})

app.get('/api/v1/auth/session', async (c) => {
  try {
    const sessionUser = c.get('user')

    if (!sessionUser) {
      return c.json({ user: null }, 401)
    }

    const supabase = createSupabaseClient(c)
    const user = await findUserById(supabase, sessionUser.id)

    if (!user) {
      return c.json({ user: null }, 404)
    }

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    console.error('Session fetch failed', error)
    return c.json({ error: 'Failed to fetch session' }, 500)
  }
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
