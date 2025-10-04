import { Hono } from 'hono'
import { createJWT, setAuthCookie, getAuthCookie, clearAuthCookie } from '../../lib/auth'
import { createSupabaseClient } from '../../lib/supabase'
import { verifyLineIdToken, upsertLineUser } from './service'
import { serializeUserResponse } from '@casto/shared'
import type { AppBindings } from '../../types'

const authRoutes = new Hono<AppBindings>()

/**
 * LINE認証エンドポイント
 * POST /api/v1/auth/line/verify
 */
authRoutes.post('/auth/line/verify', async (c) => {
  console.log('[Auth] LINE verify endpoint called')
  
  try {
    const body = await c.req.json<{ idToken: string }>()
    console.log('[Auth] Request body received, idToken present:', !!body.idToken)
    console.log('[Auth] idToken snippet:', body.idToken?.substring(0, 50) + '...')
    
    const { idToken } = body

    if (!idToken) {
      console.error('[Auth] idToken is missing')
      return c.json({ error: 'idToken is required' }, 400)
    }

    const channelId = c.env.LINE_CHANNEL_ID
    console.log('[Auth] LINE_CHANNEL_ID configured:', !!channelId)
    console.log('[Auth] LINE_CHANNEL_ID value:', channelId)
    
    if (!channelId) {
      console.error('[Auth] LINE_CHANNEL_ID is not configured')
      return c.json({ error: 'LINE authentication is not configured' }, 500)
    }

    // LINE IDトークンを検証
    console.log('[Auth] Calling verifyLineIdToken...')
    const profile = await verifyLineIdToken(idToken, channelId)
    console.log('[Auth] LINE profile verified:', profile.userId)

    // ユーザーをDBにUPSERT
    const user = await upsertLineUser(c, profile)
    console.log('[Auth] User upserted:', user.id)

    // JWTを生成
    const jwtSecret = c.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET is not configured')
      return c.json({ error: 'JWT secret is not configured' }, 500)
    }

    const token = await createJWT(
      {
        userId: user.id,
        roles: ['applicant'],
        provider: 'line',
        tokenVersion: user.token_version ?? 0
      },
      jwtSecret
    )

    // Cookieにセット
    setAuthCookie(c, token)

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    console.error('[Auth] LINE verification failed:', error)
    console.error('[Auth] Error type:', typeof error)
    console.error('[Auth] Error name:', error instanceof Error ? error.name : 'N/A')
    console.error('[Auth] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'N/A')
    
    return c.json(
      {
        error: 'LINE authentication failed',
        details: error instanceof Error ? error.message : String(error),
        type: typeof error,
        stack: error instanceof Error ? error.stack : undefined
      },
      401
    )
  }
})

/**
 * セッション取得エンドポイント
 * GET /api/v1/auth/session
 * 
 * セッション取得時にクッキーの有効期限を自動延長する [REH]
 */
authRoutes.get('/auth/session', async (c) => {
  const userContext = c.get('user')

  if (!userContext) {
    return c.json({ user: null }, 200)
  }

  try {
    const supabase = createSupabaseClient(c)
    const { data, error } = await supabase
      .from('users')
      .select('id, email, line_user_id, display_name, token_version')
      .eq('id', userContext.id)
      .single()

    if (error || !data) {
      return c.json({ user: null }, 200)
    }

    // セッション延長: 新しいJWTトークンを発行してクッキーを更新 [REH]
    const jwtSecret = c.env.JWT_SECRET
    if (jwtSecret) {
      const provider = userContext.provider === 'email' ? 'email' : 'line'
      const token = await createJWT(
        {
          userId: data.id,
          roles: userContext.roles,
          provider,
          tokenVersion: data.token_version ?? 0
        },
        jwtSecret
      )
      setAuthCookie(c, token)
      console.log('[Auth] Session cookie refreshed for user:', data.id)
    }

    return c.json({
      user: serializeUserResponse(data)
    })
  } catch (error) {
    console.error('[Auth] Failed to fetch session:', error)
    return c.json({ user: null }, 200)
  }
})

/**
 * ログアウトエンドポイント
 * POST /api/v1/auth/logout
 */
authRoutes.post('/auth/logout', async (c) => {
  clearAuthCookie(c)
  return c.json({ success: true })
})

export default authRoutes
