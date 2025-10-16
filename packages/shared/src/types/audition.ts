/**
 * オーディション関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

import type { AuditionGenre } from './auditionGenre'
import type { AuditionArea } from './auditionArea'
import type { MediaType } from './media'

/**
 * オーディションステータス
 */
export type AuditionStatus = 'draft' | 'published' | 'closed' | 'cancelled'

/**
 * プロジェクトタイプ
 */
export type ProjectType = 'audition' | 'job'

/**
 * 審査方式（Phase 3Aではmanualのみ）
 */
export type EvaluationMode = 'manual' | 'score_threshold' | 'top_n' | 'hybrid'

/**
 * auditionsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionRow {
  id: string
  organizer_id: string
  title: string
  description: string | null
  requirements: string | null
  short_description: string | null
  cover_image_url: string | null
  cover_image_alt: string | null
  main_visual_url: string | null
  main_visual_type: MediaType | null
  application_start_date: string
  application_end_date: string
  max_applicants: number | null
  status: AuditionStatus
  project_type: ProjectType
  evaluation_mode: EvaluationMode
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用のオーディション情報
 */
export interface Audition {
  id: string
  organizerId: string
  title: string
  description?: string
  requirements?: string
  shortDescription?: string
  coverImageUrl?: string
  coverImageAlt?: string
  mainVisualUrl?: string
  mainVisualType?: MediaType
  applicationStartDate: string
  applicationEndDate: string
  maxApplicants?: number
  status: AuditionStatus
  projectType: ProjectType
  evaluationMode: EvaluationMode
  genres?: AuditionGenre[]
  areas?: AuditionArea[]
  createdAt: string
  updatedAt: string
}

/**
 * オーディション一覧レスポンス
 */
export interface AuditionsResponse {
  auditions: Audition[]
  total: number
  page?: number
  perPage?: number
}

/**
 * オーディション作成リクエスト
 */
export interface CreateAuditionRequest {
  title: string
  description?: string
  requirements?: string
  shortDescription?: string
  coverImageUrl?: string
  coverImageAlt?: string
  applicationStartDate: string
  applicationEndDate: string
  maxApplicants?: number
  projectType: ProjectType
  genreIds?: string[]
  areaIds?: string[]
}

/**
 * オーディション更新リクエスト
 */
export interface UpdateAuditionRequest {
  title?: string
  description?: string
  requirements?: string
  shortDescription?: string
  coverImageUrl?: string
  coverImageAlt?: string
  applicationStartDate?: string
  applicationEndDate?: string
  maxApplicants?: number
  status?: AuditionStatus
  genreIds?: string[]
  areaIds?: string[]
}

/**
 * オーディション詳細レスポンス（統計情報含む）
 */
export interface AuditionDetailResponse extends Audition {
  applicationCount?: number
  organizerName?: string
}

/**
 * オーディションフィルタオプション
 */
export interface AuditionFilterOptions {
  status?: AuditionStatus
  projectType?: ProjectType
  genreIds?: string[]
  organizerId?: string
  search?: string
  page?: number
  perPage?: number
}
