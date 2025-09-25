/**
 * 高度な認可ミドルウェア
 * RBACシステムとの連携
 */

import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import type { Session } from '../types/auth'
import { RBACManager } from '../utils/rbac/rbac-manager'

interface AuthContext {
  Variables: {
    session: Session | null
    user: any | null
    rbac: RBACManager
  }
}

export class AuthorizationMiddleware {
  private rbacManager: RBACManager

  constructor() {
    this.rbacManager = new RBACManager()
  }

  /**
   * 権限ベースの認可ミドルウェア
   */
  requirePermission = (permission: string) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      if (!this.rbacManager.hasPermission(session, permission)) {
        return c.json({
          success: false,
          error: `Insufficient permissions: ${permission} required`
        }, 403)
      }

      await next()
    }
  }

  /**
   * 複数の権限のいずれかが必要な場合
   */
  requireAnyPermission = (permissions: string[]) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      if (!this.rbacManager.hasAnyPermission(session, permissions)) {
        return c.json({
          success: false,
          error: `One of the following permissions required: ${permissions.join(', ')}`
        }, 403)
      }

      await next()
    }
  }

  /**
   * 複数の権限をすべて必要な場合
   */
  requireAllPermissions = (permissions: string[]) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      if (!this.rbacManager.hasAllPermissions(session, permissions)) {
        return c.json({
          success: false,
          error: `All of the following permissions required: ${permissions.join(', ')}`
        }, 403)
      }

      await next()
    }
  }

  /**
   * ロールベースの認可ミドルウェア
   */
  requireRole = (role: string) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      if (!this.rbacManager.hasRole(session, role)) {
        return c.json({
          success: false,
          error: `Role required: ${role}`
        }, 403)
      }

      await next()
    }
  }

  /**
   * 複数のロールのいずれかが必要な場合
   */
  requireAnyRole = (roles: string[]) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      if (!this.rbacManager.hasAnyRole(session, roles)) {
        return c.json({
          success: false,
          error: `One of the following roles required: ${roles.join(', ')}`
        }, 403)
      }

      await next()
    }
  }

  /**
   * リソースアクセス権限チェック
   */
  requireResourceAccess = (resource: string, action: string) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      if (!this.rbacManager.canAccessResource(session, resource, action)) {
        return c.json({
          success: false,
          error: `${resource}:${action} access denied`
        }, 403)
      }

      await next()
    }
  }

  /**
   * 所有者チェック（自分のリソースのみアクセス可能）
   */
  requireOwnership = (userIdParam: string = 'userId') => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      const requestedUserId = c.req.param(userIdParam)

      if (session.userId !== requestedUserId && !this.rbacManager.hasRole(session, 'admin')) {
        return c.json({
          success: false,
          error: 'Access denied: can only access your own resources'
        }, 403)
      }

      await next()
    }
  }

  /**
   * 条件付き認可（複雑なビジネスロジック）
   */
  requireConditionalAccess = (conditionFn: (c: Context, session: Session) => boolean | Promise<boolean>) => {
    return async (c: Context, next: Next) => {
      const session = c.get('session')

      if (!session) {
        return c.json({
          success: false,
          error: 'Authentication required'
        }, 401)
      }

      const hasAccess = await conditionFn(c, session)

      if (!hasAccess) {
        return c.json({
          success: false,
          error: 'Access denied by business rules'
        }, 403)
      }

      await next()
    }
  }

  /**
   * 管理者のみアクセス可能
   */
  adminOnly = async (c: Context, next: Next) => {
    const session = c.get('session')

    if (!session) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401)
    }

    if (!this.rbacManager.hasRole(session, 'admin')) {
      return c.json({
        success: false,
        error: 'Admin access required'
      }, 403)
    }

    await next()
  }

  /**
   * 認証済みユーザーのみアクセス可能
   */
  authenticatedOnly = async (c: Context, next: Next) => {
    const session = c.get('session')

    if (!session) {
      return c.json({
        success: false,
        error: 'Authentication required'
      }, 401)
    }

    await next()
  }

  /**
   * 権限情報の取得
   */
  getUserPermissions = (c: Context) => {
    const session = c.get('session')
    return session?.permissions || []
  }

  /**
   * ロール情報の取得
   */
  getUserRoles = (c: Context) => {
    const session = c.get('session')
    return session?.roles || []
  }

  /**
   * 権限チェックヘルパー
   */
  checkPermission = (c: Context, permission: string): boolean => {
    const session = c.get('session')
    return session ? this.rbacManager.hasPermission(session, permission) : false
  }

  /**
   * ロールチェックヘルパー
   */
  checkRole = (c: Context, role: string): boolean => {
    const session = c.get('session')
    return session ? this.rbacManager.hasRole(session, role) : false
  }
}
