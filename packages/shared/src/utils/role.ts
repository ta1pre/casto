/**
 * ロール関連のユーティリティ関数
 * [DRY][CA] Workers/Web共通のデータ変換ロジック
 */

import type {
  SupabaseRoleRow,
  RoleResponse,
  RoleName,
} from '../types/role'

/**
 * Supabaseのrolesテーブル行データをAPIレスポンス形式に変換
 * [DRY] Workers/Web双方で同じ変換ロジックを使用
 */
export function serializeRoleResponse(row: SupabaseRoleRow): RoleResponse {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
  }
}

/**
 * 複数のロール行データを変換
 */
export function serializeRolesResponse(rows: SupabaseRoleRow[]): RoleResponse[] {
  return rows.map(serializeRoleResponse)
}

/**
 * ロール名に対応するダッシュボードURLを取得
 * [CA] ロール別のリダイレクト先を一元管理
 */
export function getRoleDashboardUrl(roleName: RoleName): string {
  const dashboardUrls: Record<RoleName, string> = {
    admin: '/admin/dashboard',
    organizer: '/organizer/dashboard',
    talent: '/liff',
    fan: '/liff',
  }
  
  return dashboardUrls[roleName]
}

/**
 * ロール名の表示名を取得
 */
export function getRoleDisplayName(roleName: RoleName): string {
  const displayNames: Record<RoleName, string> = {
    admin: '運営管理者',
    organizer: '主催者',
    talent: 'タレント',
    fan: 'ファン',
  }
  
  return displayNames[roleName]
}

/**
 * ユーザーが特定のロールを持っているか確認
 */
export function hasRole(userRoles: RoleName[], targetRole: RoleName): boolean {
  return userRoles.includes(targetRole)
}

/**
 * ユーザーが複数のロールのいずれかを持っているか確認
 */
export function hasAnyRole(userRoles: RoleName[], targetRoles: RoleName[]): boolean {
  return targetRoles.some(role => userRoles.includes(role))
}
