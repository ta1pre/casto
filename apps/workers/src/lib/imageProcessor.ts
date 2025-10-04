/**
 * 画像処理ライブラリ
 * 
 * [SF] リサイズ・圧縮処理
 * 
 * NOTE: Cloudflare Workersには標準の画像処理ライブラリがないため、
 * 現時点ではリサイズ処理をスキップし、将来的にCloudflare Imagesまたは
 * 外部ライブラリを使用する形に拡張する
 */

import { PHOTO_CONFIG } from '@casto/shared'

/**
 * 画像のリサイズ（将来実装予定）
 * 
 * TODO: Cloudflare Imagesまたはsharp.jsなどの画像処理ライブラリを使用
 * 現時点では元のファイルをそのまま返す
 */
export async function resizeImage(
  file: File | Blob,
  maxDimension: number = PHOTO_CONFIG.MAX_DIMENSION
): Promise<Blob> {
  // 将来的にはここで画像リサイズ処理を実装
  // 現時点では元のファイルをそのまま返す
  return file
}

/**
 * ファイル名の生成
 */
export function generatePhotoFilename(
  userId: string,
  index: number,
  file: File | Blob
): string {
  const extension = getFileExtension(file)
  return `${userId}/${index}${extension}`
}

/**
 * ファイル拡張子の取得
 */
function getFileExtension(file: File | Blob): string {
  if (file.type === 'image/jpeg') return '.jpg'
  if (file.type === 'image/png') return '.png'
  if (file.type === 'image/webp') return '.webp'
  return '.jpg' // デフォルト
}

/**
 * 公開URLの生成
 */
export function getPhotoPublicUrl(
  userId: string,
  index: number,
  bucketName: string = 'talent-photos'
): string {
  // R2の公開URL形式
  // NOTE: 環境に応じてドメインを変更する必要がある
  return `https://pub-XXXXX.r2.dev/${userId}/${index}.jpg`
}
