import { Hono } from 'hono'
import { createJWT, setAuthCookie, getAuthCookie, clearAuthCookie } from '../../lib/auth'
import { createSupabaseClient } from '../../lib/supabase'
import { verifyLineIdToken, upsertLineUser } from './service'
import type { AppBindings } from '../../types'

const authRoutes = new Hono<AppBindings>()

/**
 * LINE認証エンドポイント
 * POST /api/v1/auth/line/verify
 */
authRoutes.post('/auth/line/verify', async (c) => {
  try {
    const { idToken } = await c.req.json<{ idToken: string }>()

    if (!idToken) {
      return c.json({ error: 'idToken is required' }, 400)
    }

    const channelId = c.env.LINE_CHANNEL_ID
    if (!channelId) {
      console.error('[Auth] LINE_CHANNEL_ID is not configured')
      return c.json({ error: 'LINE authentication is not configured' }, 500)
    }

    // LINE IDトークンを検証
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
        roles: [user.role],
        provider: 'line',
        tokenVersion: user.tokenVersion
      },
      jwtSecret
    )

    // Cookieにセット
    setAuthCookie(c, token)

    return c.json({
      user: {
        id: user.id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        provider: 'line',
        role: user.role
      }
    })
  } catch (error) {
    console.error('[Auth] LINE verification failed:', error)
    return c.json(
      {
        error: 'LINE authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      401
    )
  }
})

/**
 * セッション取得エンドポイント
 * GET /api/v1/auth/session
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
      .select('id, email, line_user_id, display_name, picture_url, role, auth_provider, token_version')
      .eq('id', userContext.id)
      .single()

    if (error || !data) {
      return c.json({ user: null }, 200)
    }

    return c.json({
      user: {
        id: data.id,
        email: data.email,
        lineUserId: data.line_user_id,
        displayName: data.display_name,
        pictureUrl: data.picture_url,
        provider: data.auth_provider,
        role: data.role,
        tokenVersion: data.token_version
      }
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
