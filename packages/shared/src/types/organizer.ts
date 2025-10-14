/**
 * 主催者プロフィール型定義
 * [SF][CA][DRY] フロントエンド/バックエンド共通型
 */

/**
 * 日本の都道府県リスト
 */
export const PREFECTURES = [
  '北海道',
  '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
  '沖縄県',
] as const

export type Prefecture = typeof PREFECTURES[number]

/**
 * Supabaseから取得する主催者プロフィールの生データ
 */
export interface SupabaseOrganizerProfileRow {
  id: string
  organizer_id: string
  logo_url?: string | null
  logo_position_x?: number | null
  logo_position_y?: number | null
  logo_scale?: number | null
  name: string
  contact_person?: string | null
  prefecture: string
  address_detail: string
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
  logoPositionX: number
  logoPositionY: number
  logoScale: number
  name: string
  contactPerson: string | null
  prefecture: string
  addressDetail: string
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
  logoPositionX?: number
  logoPositionY?: number
  logoScale?: number
  name: string
  contactPerson?: string | null
  prefecture: string
  addressDetail: string
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
  ADDRESS_DETAIL_MAX_LENGTH: 200,
  PHONE_PATTERN: /^[0-9\-+() ]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const
