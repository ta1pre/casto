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
 * 画像のアスペクト比を検証（1:1のみ許可）
 */
export async function validateImageAspectRatio(file: File): Promise<MediaValidationError | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      const tolerance = 0.05 // ±5%の許容範囲
      
      if (Math.abs(ratio - 1.0) > tolerance) {
        resolve({
          field: 'file',
          message: `画像は正方形（1:1）である必要があります。現在: ${img.width}×${img.height}px`,
          code: 'INVALID_ASPECT_RATIO'
        })
      } else {
        resolve(null)
      }
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      resolve(null) // エラー時はスキップ（他のバリデーションに任せる）
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 動画のアスペクト比を検証（1:1のみ許可）
 */
export async function validateVideoAspectRatio(file: File): Promise<MediaValidationError | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      const ratio = video.videoWidth / video.videoHeight
      const tolerance = 0.05 // ±5%の許容範囲
      
      if (Math.abs(ratio - 1.0) > tolerance) {
        resolve({
          field: 'file',
          message: `動画は正方形（1:1）である必要があります。現在: ${video.videoWidth}×${video.videoHeight}px`,
          code: 'INVALID_ASPECT_RATIO'
        })
      } else {
        resolve(null)
      }
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve(null) // エラー時はスキップ
    }
    video.src = URL.createObjectURL(file)
  })
}

/**
 * アスペクト比の検証（画像・動画両対応）
 */
export async function validateAspectRatio(file: File): Promise<MediaValidationError | null> {
  const mediaType = detectMediaType(file)
  
  if (mediaType === 'image') {
    return validateImageAspectRatio(file)
  } else if (mediaType === 'video') {
    return validateVideoAspectRatio(file)
  }
  
  return null
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
