/**
 * タレント・モデルのプロフィール型定義
 * 
 * [SF][DRY] フロントエンド/バックエンド共通型
 */

// ==================== 入力・レスポンス型 ====================

/**
 * プロフィール入力データ（Web → Workers）
 */
export interface TalentProfileInput {
  // 基本情報（必須）
  stage_name: string
  gender: 'male' | 'female' | 'other'
  birthdate: string | null // YYYY-MM-DD形式
  prefecture: string

  // 基本情報（任意）
  occupation?: string | null

  // 体型情報（任意、数値型）
  height?: number | null
  weight?: number | null
  bust?: number | null
  waist?: number | null
  hip?: number | null

  // 自己PR
  achievements?: string | null

  // 活動情報（任意）
  can_move?: boolean | null
  can_stay?: boolean | null
  passport_status?: string | null

  // 所属・ステータス
  affiliation_type?: 'freelance' | 'business-partner' | 'exclusive' | null
  agency?: string | null

  // SNS情報（任意）
  twitter?: string | null
  instagram?: string | null
  tiktok?: string | null
  youtube?: string | null
  followers?: string | null

  // 写真URL（将来実装）
  photo_face_url?: string | null
  photo_full_body_url?: string | null
}

/**
 * プロフィールレスポンス（Workers → Web）
 */
export interface TalentProfileResponse {
  user_id: string
  stage_name: string
  gender: string
  birthdate: string
  prefecture: string
  occupation: string | null
  height: number | null
  weight: number | null
  bust: number | null
  waist: number | null
  hip: number | null
  achievements: string | null
  can_move: boolean | null
  can_stay: boolean | null
  passport_status: string | null
  affiliation_type: string | null
  agency: string | null
  twitter: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  followers: string | null
  photo_face_url: string | null
  photo_full_body_url: string | null
  completion_rate: number
  completion_sections: ProfileCompletionSections
  created_at: string
  updated_at: string
}

/**
 * データベース行型（Workers内部用）
 */
export interface TalentProfileRow {
  user_id: string
  stage_name: string
  gender: string
  birthdate: string
  prefecture: string
  occupation: string | null
  height: number | null
  weight: number | null
  bust: number | null
  waist: number | null
  hip: number | null
  achievements: string | null
  can_move: boolean | null
  can_stay: boolean | null
  passport_status: string | null
  affiliation_type: string | null
  agency: string | null
  twitter: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  followers: string | null
  photo_face_url: string | null
  photo_full_body_url: string | null
  completion_rate: number
  completion_sections: Record<string, unknown> // JSONB型
  created_at: string
  updated_at: string
}

// ==================== 完成度関連型 ====================

/**
 * プロフィール完成度セクション状態
 */
export interface ProfileCompletionSections {
  basic: boolean      // 基本情報（必須4項目）
  photo: boolean      // 写真（face/full_body）
  detail: boolean     // 詳細情報（体型・自己PR等）
  affiliation: boolean // 所属・ステータス
  sns: boolean        // SNS情報
}

/**
 * 完成度計算結果
 */
export interface ProfileCompletionResult {
  completionRate: number
  sections: ProfileCompletionSections
}

// ==================== バリデーション型 ====================

/**
 * バリデーションエラー
 */
export interface ProfileValidationError {
  field: string
  message: string
}

/**
 * バリデーション結果
 */
export interface ProfileValidationResult {
  valid: boolean
  errors: ProfileValidationError[]
}
