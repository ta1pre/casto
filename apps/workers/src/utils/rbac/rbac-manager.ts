/**
 * RBAC（Role-Based Access Control）システム
 * ロールと権限の管理
 */

import type { Role, Permission, User } from '../../types/auth'

export class RBACManager {
  private roles: Map<string, Role> = new Map()
  private permissions: Map<string, Permission> = new Map()

  constructor() {
    this.initializeDefaultRoles()
    this.initializeDefaultPermissions()
  }

  /**
   * デフォルトロールの初期化
   */
  private initializeDefaultRoles(): void {
    const roles: Role[] = [
      {
        id: 'admin',
        name: 'admin',
        description: 'システム全体の管理者権限',
        permissions: []
      },
      {
        id: 'host',
        name: 'host',
        description: 'ホスト（主催者）権限',
        permissions: []
      },
      {
        id: 'manager',
        name: 'manager',
        description: 'マネージャー権限',
        permissions: []
      },
      {
        id: 'fan',
        name: 'fan',
        description: 'ファン（一般ユーザー）権限',
        permissions: []
      },
      {
        id: 'guest',
        name: 'guest',
        description: 'ゲスト（未認証）権限',
        permissions: []
      }
    ]

    roles.forEach(role => {
      this.roles.set(role.id, role)
    })
  }

  /**
   * デフォルト権限の初期化
   */
  private initializeDefaultPermissions(): void {
    const permissions: Permission[] = [
      // ユーザー管理
      { id: 'user:read', name: 'user:read', resource: 'user', action: 'read' },
      { id: 'user:write', name: 'user:write', resource: 'user', action: 'write' },
      { id: 'user:delete', name: 'user:delete', resource: 'user', action: 'delete' },

      // イベント管理
      { id: 'audition:read', name: 'audition:read', resource: 'audition', action: 'read' },
      { id: 'audition:write', name: 'audition:write', resource: 'audition', action: 'write' },
      { id: 'audition:delete', name: 'audition:delete', resource: 'audition', action: 'delete' },
      { id: 'audition:publish', name: 'audition:publish', resource: 'audition', action: 'publish' },

      // 応募管理
      { id: 'entry:read', name: 'entry:read', resource: 'entry', action: 'read' },
      { id: 'entry:write', name: 'entry:write', resource: 'entry', action: 'write' },
      { id: 'entry:approve', name: 'entry:approve', resource: 'entry', action: 'approve' },
      { id: 'entry:reject', name: 'entry:reject', resource: 'entry', action: 'reject' },

      // コンテンツ閲覧
      { id: 'content:read', name: 'content:read', resource: 'content', action: 'read' },

      // プロフィール管理
      { id: 'profile:read', name: 'profile:read', resource: 'profile', action: 'read' },
      { id: 'profile:write', name: 'profile:write', resource: 'profile', action: 'write' },

      // システム管理
      { id: 'system:admin', name: 'system:admin', resource: 'system', action: 'admin' }
    ]

    permissions.forEach(permission => {
      this.permissions.set(permission.id, permission)
    })

    this.assignPermissionsToRoles()
  }

  /**
   * ロールに権限を割り当て
   */
  private assignPermissionsToRoles(): void {
    // Admin - 全権限
    const adminRole = this.roles.get('admin')
    if (adminRole) {
      adminRole.permissions = Array.from(this.permissions.values())
    }

    // Host - イベント管理権限
    const hostRole = this.roles.get('host')
    if (hostRole) {
      hostRole.permissions = [
        this.permissions.get('audition:read')!,
        this.permissions.get('audition:write')!,
        this.permissions.get('audition:delete')!,
        this.permissions.get('audition:publish')!,
        this.permissions.get('entry:read')!,
        this.permissions.get('entry:approve')!,
        this.permissions.get('entry:reject')!,
        this.permissions.get('content:read')!,
        this.permissions.get('profile:read')!,
        this.permissions.get('profile:write')!
      ].filter(Boolean)
    }

    // Manager - マネージャー権限
    const managerRole = this.roles.get('manager')
    if (managerRole) {
      managerRole.permissions = [
        this.permissions.get('audition:read')!,
        this.permissions.get('audition:write')!,
        this.permissions.get('entry:read')!,
        this.permissions.get('entry:approve')!,
        this.permissions.get('entry:reject')!,
        this.permissions.get('content:read')!,
        this.permissions.get('profile:read')!,
        this.permissions.get('profile:write')!
      ].filter(Boolean)
    }

    // Fan - 一般ユーザー権限
    const fanRole = this.roles.get('fan')
    if (fanRole) {
      fanRole.permissions = [
        this.permissions.get('content:read')!,
        this.permissions.get('profile:read')!,
        this.permissions.get('profile:write')!
      ].filter(Boolean)
    }

    // Guest - ゲスト権限
    const guestRole = this.roles.get('guest')
    if (guestRole) {
      guestRole.permissions = [
        this.permissions.get('content:read')!
      ].filter(Boolean)
    }
  }

  /**
   * ユーザーの権限チェック
   */
  hasPermission(user: User, permissionName: string): boolean {
    return user.permissions.some(p => p.name === permissionName)
  }

  /**
   * ユーザーのロールチェック
   */
  hasRole(user: User, roleName: string): boolean {
    return user.roles.some(r => r.name === roleName)
  }

  /**
   * 複数の権限のいずれかを持つかチェック
   */
  hasAnyPermission(user: User, permissionNames: string[]): boolean {
    return permissionNames.some(permissionName =>
      this.hasPermission(user, permissionName)
    )
  }

  /**
   * 複数の権限をすべて持つかチェック
   */
  hasAllPermissions(user: User, permissionNames: string[]): boolean {
    return permissionNames.every(permissionName =>
      this.hasPermission(user, permissionName)
    )
  }

  /**
   * 複数のロールのいずれかを持つかチェック
   */
  hasAnyRole(user: User, roleNames: string[]): boolean {
    return roleNames.some(roleName =>
      this.hasRole(user, roleName)
    )
  }

  /**
   * リソースへのアクセス権限チェック
   */
  canAccessResource(user: User, resource: string, action: string): boolean {
    const requiredPermission = `${resource}:${action}`
    return this.hasPermission(user, requiredPermission)
  }

  /**
   * ロールの取得
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null
  }

  /**
   * すべてのロールを取得
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  /**
   * 権限の取得
   */
  getPermission(permissionId: string): Permission | null {
    return this.permissions.get(permissionId) || null
  }

  /**
   * すべての権限を取得
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values())
  }

  /**
   * ロールに権限を追加
   */
  addPermissionToRole(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId)
    const permission = this.permissions.get(permissionId)

    if (!role || !permission) {
      return false
    }

    if (!role.permissions.some(p => p.id === permissionId)) {
      role.permissions.push(permission)
    }

    return true
  }

  /**
   * ロールから権限を削除
   */
  removePermissionFromRole(roleId: string, permissionId: string): boolean {
    const role = this.roles.get(roleId)

    if (!role) {
      return false
    }

    role.permissions = role.permissions.filter(p => p.id !== permissionId)
    return true
  }

  /**
   * 新しいロールの作成
   */
  createRole(name: string, description: string, permissions: string[] = []): Role | null {
    if (this.roles.has(name)) {
      return null // 既に存在する
    }

    const role: Role = {
      id: name,
      name,
      description,
      permissions: permissions
        .map(permissionId => this.permissions.get(permissionId))
        .filter((p): p is Permission => p !== undefined)
    }

    this.roles.set(name, role)
    return role
  }

  /**
   * ロールの削除
   */
  deleteRole(roleId: string): boolean {
    if (roleId === 'admin' || roleId === 'guest') {
      return false // 基本ロールは削除不可
    }

    return this.roles.delete(roleId)
  }
}
