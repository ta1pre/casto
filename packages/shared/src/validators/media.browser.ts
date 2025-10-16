/**
 * メディアバリデーション（ブラウザ専用）
 * 
 * [SF][REH] ブラウザAPIを使用するバリデーション関数
 * ⚠️ このファイルはフロントエンドでのみインポートしてください
 */

import type { MediaValidationError } from '../types/media'
import { detectMediaType } from './media'

/**
 * 画像のアスペクト比を検証（1:1のみ許可）
 * ⚠️ ブラウザ環境専用（Image API使用）
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
 * ⚠️ ブラウザ環境専用（Video API使用）
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
 * ⚠️ ブラウザ環境専用
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
