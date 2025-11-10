/**
 * オーディション関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

import type { AuditionGenre } from './auditionGenre'
import type { AuditionArea } from './auditionArea'
import type { AuditionStep } from './auditionStep'
import type { MediaType } from './media'

/**
 * オーディションステータス
 */
export type AuditionStatus = 'draft' | 'published' | 'closed' | 'cancelled'

/**
 * プロジェクトタイプ
 */
export type ProjectType = 'audition' | 'job' | 'extra'

/**
 * 審査方式（Phase 3Aではmanualのみ）
 */
export type EvaluationMode = 'manual' | 'score_threshold' | 'top_n' | 'hybrid'

/**
 * エキストラ募集の拡張データ
 */
export interface ExtraDetails {
  meetingPlace?: string // 集合場所
  eventDates?: string[] // 開催日程（ISO 8601形式）
  expectedHeadcount?: number // 想定人数
  notes?: string // 備考
}

/**
 * 求人の拡張データ
 */
export interface JobDetails {
  workLocation?: string // 勤務地
  employmentType?: string // 雇用形態
  salary?: string // 給与
  notes?: string // 備考
}

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
  extra_details: Record<string, unknown> | null
  admin_display_label_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Admin表示ラベル
 */
export interface AdminDisplayLabel {
  id: string
  label: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
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
  extraDetails?: ExtraDetails | JobDetails | Record<string, unknown>
  genres?: AuditionGenre[]
  area?: AuditionArea
  steps?: AuditionStep[]
  adminDisplayLabelId?: string
  adminDisplayLabel?: AdminDisplayLabel
  organizerName?: string
  organizerProfileImageUrl?: string
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
  extraDetails?: ExtraDetails | JobDetails | Record<string, unknown>
  genreIds?: string[]
  areaId?: string
  adminDisplayLabelId?: string
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
  projectType?: ProjectType
  extraDetails?: ExtraDetails | JobDetails | Record<string, unknown>
  genreIds?: string[]
  areaId?: string
  adminDisplayLabelId?: string
}

/**
 * Admin表示ラベルレスポンス
 */
export interface AdminDisplayLabelsResponse {
  labels: AdminDisplayLabel[]
  total: number
}

/**
 * Admin表示ラベル作成リクエスト
 */
export interface CreateAdminDisplayLabelRequest {
  label: string
  description?: string
  isActive?: boolean
}

/**
 * Admin表示ラベル更新リクエスト
 */
export interface UpdateAdminDisplayLabelRequest {
  label?: string
  description?: string
  isActive?: boolean
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
