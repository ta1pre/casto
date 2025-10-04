/**
 * 写真バリデーション
 * 
 * [SF][REH] フロントエンド/バックエンド共通バリデーション
 */

import type {
  PhotoValidationResult,
  PhotoValidationError,
  PhotoIndex,
} from '../types/photo'
import { PHOTO_CONFIG } from '../types/photo'

/**
 * ファイル形式の検証
 */
export function validatePhotoType(file: File | Blob): PhotoValidationError | null {
  const allowedTypes: string[] = PHOTO_CONFIG.ALLOWED_TYPES
  
  if (!allowedTypes.includes(file.type)) {
    return {
      field: 'file',
      message: `ファイル形式が無効です。JPEG、PNG、WebPのいずれかを選択してください。`,
      code: 'INVALID_TYPE'
    }
  }
  
  return null
}

/**
 * ファイルサイズの検証
 */
export function validatePhotoSize(file: File | Blob): PhotoValidationError | null {
  if (file.size > PHOTO_CONFIG.MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    return {
      field: 'file',
      message: `ファイルサイズが大きすぎます。${sizeMB}MB（上限: ${PHOTO_CONFIG.MAX_SIZE_MB}MB）`,
      code: 'FILE_TOO_LARGE'
    }
  }
  
  return null
}

/**
 * インデックスの検証
 */
export function validatePhotoIndex(index: number): PhotoValidationError | null {
  if (!Number.isInteger(index) || index < 0 || index >= PHOTO_CONFIG.MAX_FILES) {
    return {
      field: 'index',
      message: `無効なインデックスです。0-${PHOTO_CONFIG.MAX_FILES - 1}の範囲で指定してください。`,
      code: 'INVALID_INDEX'
    }
  }
  
  return null
}

/**
 * 写真の総合バリデーション
 */
export function validatePhoto(
  file: File | Blob,
  index: number
): PhotoValidationResult {
  const errors: PhotoValidationError[] = []
  
  const typeError = validatePhotoType(file)
  if (typeError) errors.push(typeError)
  
  const sizeError = validatePhotoSize(file)
  if (sizeError) errors.push(sizeError)
  
  const indexError = validatePhotoIndex(index)
  if (indexError) errors.push(indexError)
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * ファイル拡張子の取得
 */
export function getPhotoExtension(file: File | Blob): string {
  if (file.type === 'image/jpeg') return '.jpg'
  if (file.type === 'image/png') return '.png'
  if (file.type === 'image/webp') return '.webp'
  return '.jpg' // デフォルト
}
