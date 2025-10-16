/**
 * メディアバリデーション
 * 
 * [SF][REH] フロントエンド/バックエンド共通バリデーション
 */

import type {
  MediaValidationResult,
  MediaValidationError,
  MediaType,
} from '../types/media'
import { MEDIA_CONFIG } from '../types/media'

/**
 * メディアタイプを判定
 */
export function detectMediaType(file: File | Blob): MediaType | 'unknown' {
  if (MEDIA_CONFIG.IMAGE.ALLOWED_TYPES.includes(file.type)) {
    return 'image'
  }
  if (MEDIA_CONFIG.VIDEO.ALLOWED_TYPES.includes(file.type)) {
    return 'video'
  }
  return 'unknown'
}

/**
 * ファイル形式の検証
 */
export function validateMediaType(file: File | Blob): MediaValidationError | null {
  const mediaType = detectMediaType(file)
  
  if (mediaType === 'unknown') {
    return {
      field: 'file',
      message: `ファイル形式が無効です。画像（JPEG/PNG/WebP）または動画（MP4/WebM）を選択してください。`,
      code: 'INVALID_TYPE'
    }
  }
  
  return null
}

/**
 * ファイルサイズの検証
 */
export function validateMediaSize(file: File | Blob): MediaValidationError | null {
  const mediaType = detectMediaType(file)
  
  if (mediaType === 'image') {
    if (file.size > MEDIA_CONFIG.IMAGE.MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        field: 'file',
        message: `画像サイズが大きすぎます。${sizeMB}MB（上限: ${MEDIA_CONFIG.IMAGE.MAX_SIZE_MB}MB）`,
        code: 'FILE_TOO_LARGE'
      }
    }
  } else if (mediaType === 'video') {
    if (file.size > MEDIA_CONFIG.VIDEO.MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        field: 'file',
        message: `動画サイズが大きすぎます。${sizeMB}MB（上限: ${MEDIA_CONFIG.VIDEO.MAX_SIZE_MB}MB）`,
        code: 'FILE_TOO_LARGE'
      }
    }
  }
  
  return null
}

/**
 * メディアの総合バリデーション
 */
export function validateMedia(file: File | Blob): MediaValidationResult {
  const errors: MediaValidationError[] = []
  
  const typeError = validateMediaType(file)
  if (typeError) errors.push(typeError)
  
  const sizeError = validateMediaSize(file)
  if (sizeError) errors.push(sizeError)
  
  const mediaType = detectMediaType(file)
  
  return {
    valid: errors.length === 0,
    errors,
    mediaType: mediaType !== 'unknown' ? mediaType : undefined
  }
}

/**
 * ファイル拡張子の取得
 */
export function getMediaExtension(file: File | Blob): string {
  const mediaType = detectMediaType(file)
  
  if (mediaType === 'image') {
    if (file.type === 'image/jpeg') return '.jpg'
    if (file.type === 'image/png') return '.png'
    if (file.type === 'image/webp') return '.webp'
  } else if (mediaType === 'video') {
    if (file.type === 'video/mp4') return '.mp4'
    if (file.type === 'video/webm') return '.webm'
  }
  
  return '.jpg' // デフォルト
}
