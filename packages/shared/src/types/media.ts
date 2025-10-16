/**
 * メディア（画像・動画）関連の型定義
 * 
 * [SF][DRY] フロントエンド/バックエンド共通型
 */

// ==================== 定数 ====================

/**
 * メディア設定
 */
export const MEDIA_CONFIG = {
  IMAGE: {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as string[],
  },
  VIDEO: {
    MAX_SIZE_MB: 50,
    MAX_SIZE_BYTES: 50 * 1024 * 1024,
    ALLOWED_TYPES: ['video/mp4', 'video/webm'] as string[],
    ALLOWED_EXTENSIONS: ['.mp4', '.webm'] as string[],
    MAX_DURATION_SECONDS: 60,
  },
  RECOMMENDED_DIMENSION: 1080, // 1080x1080px (1:1)
}

/**
 * メディアタイプ
 */
export type MediaType = 'image' | 'video'

// ==================== リクエスト/レスポンス型 ====================

/**
 * メディアアップロードレスポンス
 */
export interface MediaUploadResponse {
  success: boolean
  url: string
  mediaType: MediaType
  message?: string
}

/**
 * メディア削除レスポンス
 */
export interface MediaDeleteResponse {
  success: boolean
  message?: string
}

// ==================== バリデーション型 ====================

/**
 * メディアバリデーションエラー
 */
export interface MediaValidationError {
  field: string
  message: string
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'UPLOAD_FAILED'
}

/**
 * メディアバリデーション結果
 */
export interface MediaValidationResult {
  valid: boolean
  errors: MediaValidationError[]
  mediaType?: MediaType
}
