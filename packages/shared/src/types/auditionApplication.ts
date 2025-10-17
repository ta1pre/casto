/**
 * オーディション応募関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

import type { AuditionStep } from './auditionStep'

/**
 * 応募全体ステータス（ステップ機能用）
 * unread: 未開封（ポイント消費前）
 * pending: 未審査（開封済み、評価未実施）
 * in_progress: 審査中（評価進行中）
 * passed: 合格
 * rejected: 不合格
 * withdrawn: 辞退
 */
export type AuditionApplicationStatus = 'unread' | 'pending' | 'in_progress' | 'passed' | 'rejected' | 'withdrawn'

/**
 * audition_applicationsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionApplicationRow {
  id: string
  audition_id: string
  talent_id: string
  current_step_id: string | null
  overall_status: AuditionApplicationStatus
  applied_at: string
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の応募情報
 */
export interface AuditionApplication {
  id: string
  auditionId: string
  talentId: string
  currentStepId?: string
  overallStatus: AuditionApplicationStatus
  appliedAt: string
  createdAt: string
  updatedAt: string
  
  // リレーションデータ（オプション）
  currentStep?: AuditionStep
  talentName?: string  // タレント名（join時）
  profileCompletionRate?: number  // プロフィール入力率 0-100（join時）
  auditionTitle?: string  // オーディション名（join時）
}

/**
 * 応募作成リクエスト
 */
export interface CreateAuditionApplicationRequest {
  auditionId: string
}

/**
 * 応募更新リクエスト（主催者のみ）
 */
export interface UpdateAuditionApplicationRequest {
  currentStepId?: string
  overallStatus?: AuditionApplicationStatus
}

/**
 * 応募一覧レスポンス
 */
export interface AuditionApplicationsResponse {
  applications: AuditionApplication[]
  total: number
  page?: number
  perPage?: number
}

/**
 * 応募詳細レスポンス
 */
export interface AuditionApplicationDetailResponse extends AuditionApplication {
  auditionTitle?: string
}
