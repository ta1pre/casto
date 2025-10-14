/**
 * ロール関連の型定義
 * [CA][SFT] Workers/Web共通の型定義
 */

/**
 * ロール名（システム内部で使用）
 */
export type RoleName = 'admin' | 'organizer' | 'talent' | 'fan'

/**
 * rolesテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseRoleRow {
  id: string
  name: RoleName
  display_name: string
  description: string | null
  created_at: string
}

/**
 * user_rolesテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseUserRoleRow {
  id: string
  user_id: string
  role_id: string
  assigned_at: string
}

/**
 * APIレスポンス用のロール情報
 */
export interface RoleResponse {
  id: string
  name: RoleName
  displayName: string
  description: string | null
}

/**
 * ユーザーのロール情報を含むレスポンス
 */
export interface UserRolesResponse {
  userId: string
  roles: RoleResponse[]
  currentRole?: RoleName
}

/**
 * ロール切替リクエスト
 */
export interface SwitchRoleRequest {
  roleName: RoleName
}

/**
 * ロール切替レスポンス
 */
export interface SwitchRoleResponse {
  success: boolean
  currentRole: RoleName
  redirectUrl: string
}
