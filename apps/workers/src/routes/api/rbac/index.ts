/**
 * RBAC APIエンドポイント
 * ロール・権限管理機能
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import { RBACManager } from '../../../utils/rbac/rbac-manager'
import { AuthorizationMiddleware } from '../../../middleware/authorization'

export function createRBACRoutes() {
  const rbac = new Hono()
  const rbacManager = new RBACManager()
  const authzMiddleware = new AuthorizationMiddleware()

  /**
   * GET /api/rbac/roles
   * すべてのロールを取得（管理者専用）
   */
  rbac.get('/roles', authzMiddleware.adminOnly, async (c: Context) => {
    try {
      const roles = rbacManager.getAllRoles()

      return c.json({
        success: true,
        roles: roles.map((role: any) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions.map((p: any) => p.name)
        }))
      })
    } catch (error) {
      console.error('Get roles error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * POST /api/rbac/roles
   * 新しいロールを作成（管理者専用）
   */
  rbac.post('/roles', authzMiddleware.adminOnly, async (c: Context) => {
    try {
      const body = await c.req.json()

      if (!body.name || !body.description) {
        return c.json({
          success: false,
          error: 'Role name and description are required'
        }, 400)
      }

      const role = rbacManager.createRole(
        body.name,
        body.description,
        body.permissions || []
      )

      if (!role) {
        return c.json({
          success: false,
          error: 'Role already exists or invalid permissions'
        }, 400)
      }

      return c.json({
        success: true,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions.map(p => p.name)
        }
      })
    } catch (error) {
      console.error('Create role error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * PUT /api/rbac/roles/:roleId
   * ロールを更新（管理者専用）
   */
  rbac.put('/roles/:roleId', authzMiddleware.adminOnly, async (c: Context) => {
    try {
      const roleId = c.req.param('roleId')
      const body = await c.req.json()

      // 基本ロールの更新は制限
      if (roleId === 'admin' || roleId === 'guest') {
        return c.json({
          success: false,
          error: 'Cannot modify system roles'
        }, 400)
      }

      const role = rbacManager.getRole(roleId)
      if (!role) {
        return c.json({
          success: false,
          error: 'Role not found'
        }, 404)
      }

      // 権限の更新
      if (body.permissions) {
        // 既存の権限をクリア
        role.permissions = []

        // 新しい権限を追加
        body.permissions.forEach((permissionId: string) => {
          rbacManager.addPermissionToRole(roleId, permissionId)
        })
      }

      return c.json({
        success: true,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions.map(p => p.name)
        }
      })
    } catch (error) {
      console.error('Update role error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * DELETE /api/rbac/roles/:roleId
   * ロールを削除（管理者専用）
   */
  rbac.delete('/roles/:roleId', authzMiddleware.adminOnly, async (c: Context) => {
    try {
      const roleId = c.req.param('roleId')

      // 基本ロールの削除は制限
      if (roleId === 'admin' || roleId === 'guest') {
        return c.json({
          success: false,
          error: 'Cannot delete system roles'
        }, 400)
      }

      const deleted = rbacManager.deleteRole(roleId)

      if (!deleted) {
        return c.json({
          success: false,
          error: 'Role not found or cannot be deleted'
        }, 400)
      }

      return c.json({
        success: true,
        message: 'Role deleted successfully'
      })
    } catch (error) {
      console.error('Delete role error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * GET /api/rbac/permissions
   * すべての権限を取得（管理者専用）
   */
  rbac.get('/permissions', authzMiddleware.adminOnly, async (c: Context) => {
    try {
      const permissions = rbacManager.getAllPermissions()

      return c.json({
        success: true,
        permissions: permissions.map((permission: any) => ({
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action
        }))
      })
    } catch (error) {
      console.error('Get permissions error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * GET /api/rbac/user/permissions
   * 現在のユーザーの権限を取得（認証必須）
   */
  rbac.get('/user/permissions', authzMiddleware.authenticatedOnly, async (c: Context) => {
    try {
      const permissions = authzMiddleware.getUserPermissions(c)

      return c.json({
        success: true,
        permissions: permissions.map(p => p.name)
      })
    } catch (error) {
      console.error('Get user permissions error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * GET /api/rbac/user/roles
   * 現在のユーザーのロールを取得（認証必須）
   */
  rbac.get('/user/roles', authzMiddleware.authenticatedOnly, async (c: Context) => {
    try {
      const roles = authzMiddleware.getUserRoles(c)

      return c.json({
        success: true,
        roles: roles.map(r => r.name)
      })
    } catch (error) {
      console.error('Get user roles error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * POST /api/rbac/check/permission
   * 権限チェック（認証必須）
   */
  rbac.post('/check/permission', authzMiddleware.authenticatedOnly, async (c: Context) => {
    try {
      const body = await c.req.json()

      if (!body.permission) {
        return c.json({
          success: false,
          error: 'Permission name is required'
        }, 400)
      }

      const hasPermission = authzMiddleware.checkPermission(c, body.permission)

      return c.json({
        success: true,
        hasPermission,
        permission: body.permission
      })
    } catch (error) {
      console.error('Check permission error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  /**
   * POST /api/rbac/check/role
   * ロールチェック（認証必須）
   */
  rbac.post('/check/role', authzMiddleware.authenticatedOnly, async (c: Context) => {
    try {
      const body = await c.req.json()

      if (!body.role) {
        return c.json({
          success: false,
          error: 'Role name is required'
        }, 400)
      }

      const hasRole = authzMiddleware.checkRole(c, body.role)

      return c.json({
        success: true,
        hasRole,
        role: body.role
      })
    } catch (error) {
      console.error('Check role error:', error)
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500)
    }
  })

  return rbac
}
