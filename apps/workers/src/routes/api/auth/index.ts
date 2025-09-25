/**
 * 認証APIエンドポイント
 * 実際のHTTPハンドラー
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AuthRequest, AuthResponse } from '../../../types/auth'
import { AuthManager } from '../../../utils/auth-manager'
import { SessionManager } from '../../../utils/session-manager'
import { AuthMiddleware } from '../../../middleware/auth'

export function createAuthRoutes(kv: KVNamespace) {
  const auth = new Hono()
  const authManager = new AuthManager()
  const sessionManager = new SessionManager(kv)
  const authMiddleware = new AuthMiddleware(kv)

  /**
   * POST /api/auth/login
   * ログイン処理（LINE/メール共通）
   */
  auth.post('/login', async (c: Context) => {
    try {
      const body: AuthRequest = await c.req.json()

      if (!body.provider) {
        return c.json({
          success: false,
          error: 'Provider is required'
        }, 400)
      }

      const result = await authManager.authenticate(body)

      if (result.success && result.session) {
        // セッションをKVストアに保存
        await sessionManager.createSession(result.session)

        return c.json({
          success: true,
          session: {
            userId: result.session.userId,
            displayName: result.session.displayName,
            roles: result.session.roles,
            provider: result.session.provider,
            expiresAt: result.session.expiresAt
          }
        })
      } else {
        return c.json({
          success: false,
          error: result.error || 'Authentication failed'
        }, 401)
      }
    } catch (error) {
      console.error('Login error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * GET /api/auth/session
   * 現在のセッション情報を取得
   */
  auth.get('/session', authMiddleware.auth, async (c: Context) => {
    try {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'No active session'
        }, 401)
      }

      return c.json({
        success: true,
        session: {
          userId: session.userId,
          displayName: session.displayName,
          roles: session.roles,
          permissions: session.permissions,
          provider: session.provider,
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity
        }
      })
    } catch (error) {
      console.error('Get session error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * POST /api/auth/logout
   * ログアウト処理
   */
  auth.post('/logout', async (c: Context) => {
    try {
      const authorization = c.req.header('Authorization')

      if (!authorization || !authorization.startsWith('Bearer ')) {
        return c.json({
          success: false,
          error: 'Authorization header required'
        }, 401)
      }

      const token = authorization.substring(7)

      // セッションの削除
      await sessionManager.deleteSession(token)

      // プロバイダー別のログアウト処理
      await authMiddleware.logout(token)

      return c.json({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error) {
      console.error('Logout error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * POST /api/auth/refresh
   * セッションの延長
   */
  auth.post('/refresh', authMiddleware.auth, async (c: Context) => {
    try {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'No active session'
        }, 401)
      }

      const extendedSession = await sessionManager.extendSession(session.userId)

      if (extendedSession) {
        return c.json({
          success: true,
          session: {
            userId: extendedSession.userId,
            displayName: extendedSession.displayName,
            roles: extendedSession.roles,
            provider: extendedSession.provider,
            expiresAt: extendedSession.expiresAt
          }
        })
      } else {
        return c.json({
          success: false,
          error: 'Session extension failed'
        }, 400)
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * POST /api/auth/register
   * 新規ユーザー登録（メール認証用）
   */
  auth.post('/register', async (c: Context) => {
    try {
      const body = await c.req.json()

      if (!body.email || !body.password) {
        return c.json({
          success: false,
          error: 'Email and password are required'
        }, 400)
      }

      // メール認証プロバイダー経由で登録
      const emailProvider = authManager['providers'].get('email')
      if (!emailProvider || !emailProvider.signUp) {
        return c.json({
          success: false,
          error: 'Email provider does not support registration'
        }, 500)
      }

      const { user, requiresConfirmation } = await emailProvider.signUp(
        body.email,
        body.password,
        {
          display_name: body.displayName
        }
      )

      return c.json({
        success: true,
        requiresConfirmation,
        message: requiresConfirmation
          ? 'Please check your email to confirm your account'
          : 'Account created successfully'
      })
    } catch (error) {
      console.error('Registration error:', error)
      return c.json({
        success: false,
        error: 'Registration failed'
      }, 500)
    }
  })

  return auth
}
