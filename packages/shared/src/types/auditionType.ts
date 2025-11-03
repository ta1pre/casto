/**
 * オーディション種別関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

import type { ProjectType } from './audition'

/**
 * audition_typesテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionTypeRow {
  id: string
  type_code: ProjectType
  display_name: string
  description: string | null
  base_points: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の種別情報
 */
export interface AuditionType {
  id: string
  typeCode: ProjectType
  displayName: string
  description?: string
  basePoints: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 種別一覧レスポンス
 */
export interface AuditionTypesResponse {
  types: AuditionType[]
}

/**
 * 種別更新リクエスト（管理者のみ）
 */
export interface UpdateAuditionTypeRequest {
  displayName?: string
  description?: string
  basePoints?: number
  isActive?: boolean
}
