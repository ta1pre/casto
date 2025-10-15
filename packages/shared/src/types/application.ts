/**
 * 応募関連の型定義
 * [CA][SFT] Workers/Web共通の型定義
 */

/**
 * 応募ステータス
 */
export type ApplicationStatus = 
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

/**
 * applicationsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseApplicationRow {
  id: string
  audition_id: string
  applicant_id: string
  applicant_profile: Record<string, unknown> // JSONB
  additional_message: string | null
  additional_urls: string[]
  status: ApplicationStatus
  submitted_at: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の応募情報
 */
export interface Application {
  id: string
  auditionId: string
  applicantId: string
  applicantProfile: ApplicantProfileSnapshot
  additionalMessage?: string
  additionalUrls?: string[]
  status: ApplicationStatus
  submittedAt: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * 応募時のプロフィールスナップショット
 */
export interface ApplicantProfileSnapshot {
  stageName: string
  gender: string
  birthdate?: string
  prefecture: string
  occupation?: string
  height?: number
  weight?: number
  bust?: number
  waist?: number
  hip?: number
  achievements?: string
  affiliationType?: string
  agency?: string
  twitter?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  followers?: string
  photoFaceUrl?: string
  photoFullBodyUrl?: string
}

/**
 * 応募一覧レスポンス
 */
export interface ApplicationsResponse {
  applications: Application[]
  total: number
  page?: number
  perPage?: number
}

/**
 * 応募作成リクエスト
 */
export interface CreateApplicationRequest {
  auditionId: string
  additionalMessage?: string
  additionalUrls?: string[]
}

/**
 * 応募更新リクエスト（辞退など）
 */
export interface UpdateApplicationRequest {
  status: ApplicationStatus
}

/**
 * 応募詳細レスポンス（オーディション情報含む）
 */
export interface ApplicationDetailResponse extends Application {
  auditionTitle?: string
  auditionProjectType?: string
  organizerName?: string
  review?: {
    decision: string
    comment?: string
    reviewedAt: string
  }
}

/**
 * 応募フィルタオプション
 */
export interface ApplicationFilterOptions {
  status?: ApplicationStatus
  auditionId?: string
  applicantId?: string
  page?: number
  perPage?: number
}
