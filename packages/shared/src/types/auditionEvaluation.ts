/**
 * オーディション評価関連の型定義
 * [CA][SF] Workers/Web共通の型定義
 */

/**
 * 評価結果
 */
export type EvaluationResult = 'pending' | 'passed' | 'rejected'

/**
 * audition_step_evaluationsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseAuditionEvaluationRow {
  id: string
  application_id: string
  step_id: string
  evaluator_id: string | null
  score: number | null
  comments: string | null
  result: EvaluationResult | null
  evaluated_at: string | null
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の評価情報
 */
export interface AuditionEvaluation {
  id: string
  applicationId: string
  stepId: string
  evaluatorId?: string
  score?: number
  comments?: string
  result?: EvaluationResult
  evaluatedAt?: string
  createdAt: string
  updatedAt: string
  
  // リレーションデータ（オプション）
  stepTitle?: string
  evaluatorName?: string
}

/**
 * 評価作成リクエスト
 */
export interface CreateEvaluationRequest {
  score?: number  // 0～100
  comments?: string
  result?: EvaluationResult
}

/**
 * 評価更新リクエスト
 */
export interface UpdateEvaluationRequest {
  score?: number  // 0～100
  comments?: string
  result?: EvaluationResult
}

/**
 * 評価一覧レスポンス
 */
export interface EvaluationsResponse {
  evaluations: AuditionEvaluation[]
}
