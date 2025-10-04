/**
 * 写真アップロード関連の型定義
 * 
 * [SF][DRY] フロントエンド/バックエンド共通型
 */

// ==================== 定数 ====================

/**
 * 写真設定
 */
export const PHOTO_CONFIG = {
  MAX_FILES: 6,
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_DIMENSION: 1920,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as string[],
}

/**
 * 写真のインデックス（0-5）
 */
export type PhotoIndex = 0 | 1 | 2 | 3 | 4 | 5

/**
 * 写真タイプ
 */
export type PhotoType = 'face' | 'full_body' | 'other'

// ==================== リクエスト/レスポンス型 ====================

/**
 * 写真アップロードリクエスト
 */
export interface PhotoUploadRequest {
  index: PhotoIndex
  file: File | Blob
}

/**
 * 写真アップロードレスポンス
 */
export interface PhotoUploadResponse {
  success: boolean
  url: string
  index: PhotoIndex
  message?: string
}

/**
 * 写真削除リクエスト
 */
export interface PhotoDeleteRequest {
  index: PhotoIndex
}

/**
 * 写真削除レスポンス
 */
export interface PhotoDeleteResponse {
  success: boolean
  index: PhotoIndex
  message?: string
}

/**
 * 写真一覧取得レスポンス
 */
export interface PhotoListResponse {
  photos: string[]
  count: number
}

// ==================== バリデーション型 ====================

/**
 * 写真バリデーションエラー
 */
export interface PhotoValidationError {
  field: string
  message: string
  code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'INVALID_INDEX' | 'UPLOAD_FAILED'
}

/**
 * 写真バリデーション結果
 */
export interface PhotoValidationResult {
  valid: boolean
  errors: PhotoValidationError[]
}
