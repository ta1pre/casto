/**
 * オーディションエリア関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

/**
 * audition_areasテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionAreaRow {
  id: string
  code: string
  name: string
  sort_order: number
  created_at: string
}

/**
 * APIレスポンス用のエリア情報
 */
export interface AuditionArea {
  id: string
  code: string
  name: string
  sortOrder: number
}

/**
 * エリア一覧レスポンス
 */
export interface AuditionAreasResponse {
  areas: AuditionArea[]
}
