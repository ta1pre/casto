/**
 * 主催者認証API
 * [SFT][REH] メール認証によるサインアップ・ログイン
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { 
  signUpWithEmail, 
  signInWithEmail, 
  assignRole, 
  getUserRoles,
  sendPasswordResetEmail,
  updatePassword,
} from './service'
import { createJWT, setAuthCookie } from '../../../lib/auth'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'

const organizerAuthRoutes = new Hono<AppBindings>()

/**
 * 主催者サインアップ
 * POST /api/v1/organizer/auth/signup
 */
organizerAuthRoutes.post('/auth/signup', async (c) => {
  try {
    const body = await c.req.json<{ email: string; password: string }>()
    
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return c.json({ error: 'Invalid email format' }, 400)
    }
    
    // パスワードの強度チェック（最低8文字）
    if (body.password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400)
    }
    
    // Supabase Authでサインアップ
    const result = await signUpWithEmail(c, body.email, body.password)
    
    // organizerロールを付与
    await assignRole(c, result.userId, 'organizer')
    
    return c.json({
      success: true,
      userId: result.userId,
      email: result.email,
      message: result.needsEmailConfirmation
        ? 'Confirmation email sent. Please check your inbox.'
        : 'Account created successfully.',
    })
  } catch (error) {
    console.error('[Organizer Auth] Signup failed:', error)
    return c.json(
      {
        error: 'Signup failed',
        details: error instanceof Error ? error.message : String(error),
      },
      500
    )
  }
})

/**
 * 主催者ログイン
 * POST /api/v1/organizer/auth/login
 */
organizerAuthRoutes.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json<{ email: string; password: string }>()
    
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Supabase Authでログイン
    const authResult = await signInWithEmail(c, body.email, body.password)
    
    // ユーザーのロールを確認
    const roles = await getUserRoles(c, authResult.userId)
    
    if (!roles.includes('organizer')) {
      return c.json({ error: 'Organizer role required' }, 403)
    }
    
    // JWTトークンを生成
    const jwtSecret = c.env.JWT_SECRET
    if (!jwtSecret) {
      return c.json({ error: 'JWT secret not configured' }, 500)
    }
    
    const token = await createJWT(
      {
        userId: authResult.userId,
        roles: ['organizer'],
        provider: 'email',
        tokenVersion: 0,
      },
      jwtSecret
    )
    
    // クッキーにセット
    setAuthCookie(c, token)
    
    return c.json({
      success: true,
      userId: authResult.userId,
      email: authResult.email,
      roles,
      redirectUrl: '/organizer/dashboard',
    })
  } catch (error) {
    console.error('[Organizer Auth] Login failed:', error)
    return c.json(
      {
        error: 'Login failed',
        details: error instanceof Error ? error.message : String(error),
      },
      401
    )
  }
})

/**
 * セッション確認
 * GET /api/v1/organizer/auth/session
 */
organizerAuthRoutes.get('/auth/session', verifyOrganizerAuth, async (c) => {
  const userContext = c.get('user')
  
  if (!userContext) {
    return c.json({ error: 'No session' }, 401)
  }
  
  const roles = await getUserRoles(c, userContext.id)
  
  return c.json({
    userId: userContext.id,
    roles,
    provider: userContext.provider,
  })
})

/**
 * パスワードリセット要求
 * POST /api/v1/organizer/auth/reset-password
 */
organizerAuthRoutes.post('/auth/reset-password', async (c) => {
  try {
    const body = await c.req.json<{ email: string; redirectTo?: string }>()
    
    if (!body.email) {
      return c.json({ error: 'Email is required' }, 400)
    }
    
    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return c.json({ error: 'Invalid email format' }, 400)
    }
    
    // パスワードリセットメールを送信
    const webUrl = c.env.WEB_URL || 'http://localhost:3000'
    const redirectUrl = body.redirectTo || `${webUrl}/organizer/reset-password/confirm`
    
    await sendPasswordResetEmail(
      c, 
      body.email, 
      redirectUrl
    )
    
    return c.json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    })
  } catch (error) {
    console.error('[Organizer Auth] Password reset request failed:', error)
    // セキュリティ上、メールアドレスの存在を明かさない
    return c.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    })
  }
})

/**
 * パスワード更新
 * POST /api/v1/organizer/auth/update-password
 */
organizerAuthRoutes.post('/auth/update-password', async (c) => {
  try {
    const body = await c.req.json<{ 
      accessToken: string
      newPassword: string 
    }>()
    
    if (!body.accessToken || !body.newPassword) {
      return c.json({ error: 'Access token and new password are required' }, 400)
    }
    
    // パスワードの強度チェック（最低8文字）
    if (body.newPassword.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400)
    }
    
    // パスワードを更新
    await updatePassword(c, body.accessToken, body.newPassword)
    
    return c.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    console.error('[Organizer Auth] Password update failed:', error)
    return c.json(
      {
        error: 'Password update failed',
        details: error instanceof Error ? error.message : String(error),
      },
      400
    )
  }
})

export default organizerAuthRoutes
