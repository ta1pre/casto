/**
 * 管理者認証API
 * [SFT][REH] メール認証によるサインアップ・ログイン
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { signUpWithEmail, signInWithEmail, assignRole, getUserRoles } from './service'
import { createJWT, setAuthCookie } from '../../../lib/auth'
import { verifyAdminAuth } from '../../../middleware/verifyRoleAuth'

const adminAuthRoutes = new Hono<AppBindings>()

/**
 * 管理者サインアップ
 * POST /api/v1/admin/auth/signup
 */
adminAuthRoutes.post('/auth/signup', async (c) => {
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
    
    // adminロールを付与
    await assignRole(c, result.userId, 'admin')
    
    return c.json({
      success: true,
      userId: result.userId,
      email: result.email,
      message: result.needsEmailConfirmation
        ? 'Confirmation email sent. Please check your inbox.'
        : 'Account created successfully.',
    })
  } catch (error) {
    console.error('[Admin Auth] Signup failed:', error)
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
 * 管理者ログイン
 * POST /api/v1/admin/auth/login
 */
adminAuthRoutes.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json<{ email: string; password: string }>()
    
    if (!body.email || !body.password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Supabase Authでログイン
    const authResult = await signInWithEmail(c, body.email, body.password)
    
    // ユーザーのロールを確認
    const roles = await getUserRoles(c, authResult.userId)
    
    if (!roles.includes('admin')) {
      return c.json({ error: 'Admin role required' }, 403)
    }
    
    // JWTトークンを生成
    const jwtSecret = c.env.JWT_SECRET
    if (!jwtSecret) {
      return c.json({ error: 'JWT secret not configured' }, 500)
    }
    
    const token = await createJWT(
      {
        userId: authResult.userId,
        roles: ['admin'],
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
      redirectUrl: '/admin/dashboard',
    })
  } catch (error) {
    console.error('[Admin Auth] Login failed:', error)
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
 * GET /api/v1/admin/auth/session
 */
adminAuthRoutes.get('/auth/session', verifyAdminAuth, async (c) => {
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

export default adminAuthRoutes
