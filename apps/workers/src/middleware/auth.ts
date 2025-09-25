/**
 * 統合認証ミドルウェア
 * 認証・認可・セッション管理を統合
 */

import type { MiddlewareHandler } from 'hono'
import type { Session } from '../types/auth'
import { AuthManager } from '../utils/auth-manager'
import { SessionManager } from '../utils/session-manager'

interface AuthContext {
  Variables: {
    session: Session | null
    user: any | null
  }
}

export class AuthMiddleware {
  private authManager: AuthManager
  private sessionManager: SessionManager

  constructor(kv: KVNamespace) {
    this.authManager = new AuthManager()
    this.sessionManager = new SessionManager(kv)
  }

  /**
   * 認証ミドルウェア
   * JWTトークンを検証し、セッションを取得
   */
  auth: MiddlewareHandler = async (c, next) => {
    try {
      const authorization = c.req.header('Authorization')

      if (!authorization || !authorization.startsWith('Bearer ')) {
        c.set('session', null)
        c.set('user', null)
        await next()
        return
      }

      const token = authorization.substring(7) // Remove 'Bearer '

      // セッションの検証
      const session = await this.sessionManager.getSession(token)

      if (session) {
        c.set('session', session)
        c.set('user', {
          id: session.userId,
          displayName: session.displayName,
          roles: session.roles,
          permissions: session.permissions,
          provider: session.provider
        })
      } else {
        c.set('session', null)
        c.set('user', null)
      }

      await next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      c.set('session', null)
      c.set('user', null)
      await next()
    }
  }

  /**
   * 認可ミドルウェア
   * ユーザーの権限をチェック
   */
  authorize: (requiredPermissions: string[]) => MiddlewareHandler = (requiredPermissions) => {
    return async (c, next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      // 権限チェック
      const hasPermission = requiredPermissions.some((permission: string) =>
        session.permissions.some((p: any) => p.name === permission)
      )

      if (!hasPermission) {
        return c.json({
          success: false,
          error: 'Insufficient permissions'
        }, 403)
      }

      await next()
    }
  }

  /**
   * セッションミドルウェア
   * セッション状態を管理
   */
  session: MiddlewareHandler = async (c, next) => {
    const session = c.get('session')

    if (session) {
      // セッションの最終活動時間を更新
      await this.sessionManager.updateSession(session.userId, {
        lastActivity: new Date()
      })
    }

    await next()
  }

  /**
   * ロールベース認可ミドルウェア
   */
  requireRole: (requiredRoles: string[]) => MiddlewareHandler = (requiredRoles) => {
    return async (c, next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      // ロールチェック
      const hasRole = requiredRoles.some((role: string) =>
        session.roles.some((r: any) => r.name === role)
      )

      if (!hasRole) {
        return c.json({
          success: false,
          error: 'Insufficient role'
        }, 403)
      }

      await next()
    }
  }

  /**
   * セッションの延長
   */
  async extendSession(sessionId: string): Promise<Session | null> {
    return await this.sessionManager.extendSession(sessionId)
  }

  /**
   * ログアウト処理
   */
  async logout(accessToken: string): Promise<void> {
    await this.authManager.logout(accessToken)
  }
}
