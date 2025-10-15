/**
 * 審査関連の型定義
 * [CA][SFT] Workers/Web共通の型定義
 */

/**
 * 審査結果
 */
export type ReviewDecision = 'pending' | 'accept' | 'reject'

/**
 * application_reviewsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseApplicationReviewRow {
  id: string
  application_id: string
  reviewer_id: string
  decision: ReviewDecision
  comment: string | null
  is_final: boolean
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の審査情報
 */
export interface ApplicationReview {
  id: string
  applicationId: string
  reviewerId: string
  decision: ReviewDecision
  comment?: string
  isFinal: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 審査作成リクエスト
 */
export interface CreateReviewRequest {
  applicationId: string
  decision: ReviewDecision
  comment?: string
  isFinal?: boolean
}

/**
 * 審査更新リクエスト
 */
export interface UpdateReviewRequest {
  decision?: ReviewDecision
  comment?: string
  isFinal?: boolean
}

/**
 * 審査詳細レスポンス（応募者情報含む）
 */
export interface ReviewDetailResponse extends ApplicationReview {
  applicantName?: string
  auditionTitle?: string
  applicationStatus?: string
}

/**
 * 審査一覧レスポンス
 */
export interface ReviewsResponse {
  reviews: ApplicationReview[]
  total: number
}
