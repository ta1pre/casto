/**
 * 主催者ロゴアップロード・削除サービス
 * [SF][REH] R2ストレージとの連携処理（talent photosパターンを踏襲）
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { validatePhoto } from '@casto/shared/validators/photo'
import { generatePhotoFilename } from '../../../lib/imageProcessor'

/**
 * R2にロゴをアップロード
 */
export async function uploadLogoToR2(
  r2Bucket: R2Bucket,
  organizerId: string,
  file: File | Blob
): Promise<string> {
  // バリデーション（photoバリデーターを流用、index=0として扱う）
  const validation = validatePhoto(file, 0)
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message || 'Invalid logo')
  }

  // 既存のロゴをすべて削除（上書き前のクリーンアップ）
  await deleteLogoFromR2(r2Bucket, organizerId)

  // ファイル名生成（organizersディレクトリ配下）
  const filename = `organizers/${organizerId}/logo${getExtension(file.type)}`

  // R2にアップロード
  const arrayBuffer = await file.arrayBuffer()
  await r2Bucket.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  // Workers経由の公開URL（キャッシュバスティング用のタイムスタンプ付き）
  const timestamp = Date.now()
  const publicUrl = `/api/v1/organizer/profile/logo/view/${organizerId}?v=${timestamp}`

  return publicUrl
}

/**
 * R2からロゴを削除
 */
export async function deleteLogoFromR2(
  r2Bucket: R2Bucket,
  organizerId: string
): Promise<void> {
  // 可能性のある拡張子をすべて試す
  const extensions = ['.jpg', '.jpeg', '.png', '.webp']
  
  for (const ext of extensions) {
    const filename = `organizers/${organizerId}/logo${ext}`
    try {
      await r2Bucket.delete(filename)
    } catch (error) {
      // エラーは無視（ファイルが存在しない可能性）
      console.log(`[deleteLogoFromR2] Failed to delete ${filename}`, error)
    }
  }
}

/**
 * データベースのlogo_urlを更新（アップロード時）
 */
export async function updateLogoUrlInDB(
  supabase: SupabaseClient,
  organizerId: string,
  url: string
): Promise<string> {
  const { data, error } = await supabase
    .from('organizer_profiles')
    .update({ logo_url: url })
    .eq('organizer_id', organizerId)
    .select('logo_url')
    .single()

  if (error) {
    throw new Error(`Failed to update logo_url: ${error.message}`)
  }

  return data.logo_url || ''
}

/**
 * データベースのlogo_urlを削除
 */
export async function deleteLogoUrlFromDB(
  supabase: SupabaseClient,
  organizerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('organizer_profiles')
    .update({ logo_url: null })
    .eq('organizer_id', organizerId)
    .select('logo_url')
    .single()

  if (error) {
    throw new Error(`Failed to delete logo_url: ${error.message}`)
  }

  return data.logo_url
}

/**
 * 拡張子を取得
 */
function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    default:
      return '.jpg'
  }
}
