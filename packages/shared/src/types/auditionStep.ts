/**
 * オーディションステップ関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

/**
 * ステップ種別
 */
export type StepType = 'document_screening' | 'custom' | 'voting'

/**
 * audition_stepsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionStepRow {
  id: string
  audition_id: string
  step_order: number
  step_type: StepType
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用のステップ情報
 */
export interface AuditionStep {
  id: string
  auditionId: string
  stepOrder: number
  stepType: StepType
  title: string
  description?: string
  createdAt: string
  updatedAt: string
}

/**
 * ステップ作成リクエスト
 */
export interface CreateAuditionStepRequest {
  title: string
  description?: string
  stepType?: StepType  // デフォルトは 'custom'
}

/**
 * ステップ更新リクエスト
 */
export interface UpdateAuditionStepRequest {
  title?: string
  description?: string
}

/**
 * ステップ一覧レスポンス
 */
export interface AuditionStepsResponse {
  steps: AuditionStep[]
}
