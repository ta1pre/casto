/**
 * 主催者プロフィール型定義
 * [SF][CA][DRY] フロントエンド/バックエンド共通型
 */

/**
 * Supabaseから取得する主催者プロフィールの生データ
 */
export interface SupabaseOrganizerProfileRow {
  id: string
  organizer_id: string
  logo_url?: string | null
  name: string
  contact_person?: string | null
  address: string
  phone: string
  email?: string | null
  website?: string | null
  description: string
  instagram_url?: string | null
  x_url?: string | null
  tiktok_url?: string | null
  youtube_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の主催者プロフィール
 */
export interface OrganizerProfile {
  id: string
  organizerId: string
  logoUrl: string | null
  name: string
  contactPerson: string | null
  address: string
  phone: string
  email: string | null
  website: string | null
  description: string
  instagramUrl: string | null
  xUrl: string | null
  tiktokUrl: string | null
  youtubeUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * プロフィール作成・更新リクエスト
 */
export interface OrganizerProfileUpsertRequest {
  logoUrl?: string | null
  name: string
  contactPerson?: string | null
  address: string
  phone: string
  email?: string | null
  website?: string | null
  description: string
  instagramUrl?: string | null
  xUrl?: string | null
  tiktokUrl?: string | null
  youtubeUrl?: string | null
  isActive?: boolean
}

/**
 * プロフィール取得レスポンス
 */
export interface OrganizerProfileResponse {
  status: 'ok'
  profile: OrganizerProfile
  fetchedAt: string
}

/**
 * プロフィール更新レスポンス
 */
export interface OrganizerProfileUpdateResponse {
  status: 'ok'
  profile: OrganizerProfile
  updatedAt: string
}

/**
 * バリデーションエラー
 */
export interface OrganizerProfileValidationError {
  field: string
  message: string
  code: string
}

/**
 * バリデーション結果
 */
export interface OrganizerProfileValidationResult {
  valid: boolean
  errors: OrganizerProfileValidationError[]
}

/**
 * プロフィール設定
 */
export const ORGANIZER_PROFILE_CONFIG = {
  DESCRIPTION_MIN_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
  NAME_MAX_LENGTH: 100,
  CONTACT_PERSON_MAX_LENGTH: 50,
  ADDRESS_MAX_LENGTH: 200,
  PHONE_PATTERN: /^[0-9\-+() ]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const
