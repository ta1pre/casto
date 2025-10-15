/**
 * オーディションジャンル関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

/**
 * audition_genresテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionGenreRow {
  id: string
  slug: string
  display_name: string
  category: string | null
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用のジャンル情報
 */
export interface AuditionGenre {
  id: string
  slug: string
  displayName: string
  category?: string
  description?: string
  sortOrder: number
  isActive: boolean
}

/**
 * ジャンル一覧レスポンス
 */
export interface AuditionGenresResponse {
  genres: AuditionGenre[]
  total: number
}

/**
 * ジャンルスラッグ型（よく使われるジャンル）
 */
export type GenreSlug = 
  | 'idol'
  | 'dance'
  | 'vocal'
  | 'acting'
  | 'model'
  | 'voice_actor'
  | 'mc_host'
  | 'creator'
  | 'influencer'
  | 'campaign'
  | 'other'
