/**
 * 写真アップロード・削除サービス
 * 
 * [SF][REH] R2ストレージとの連携処理
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { validatePhoto, getPhotoExtension } from '@casto/shared/validators/photo'
import { PHOTO_CONFIG } from '@casto/shared'
import type { PhotoIndex } from '@casto/shared'
import { generatePhotoFilename } from '../../../lib/imageProcessor'

/**
 * R2に画像をアップロード
 */
export async function uploadPhotoToR2(
  r2Bucket: R2Bucket,
  userId: string,
  index: PhotoIndex,
  file: File | Blob
): Promise<string> {
  // バリデーション
  const validation = validatePhoto(file, index)
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message || 'Invalid photo')
  }

  // ファイル名生成
  const filename = generatePhotoFilename(userId, index, file)

  // R2にアップロード
  const arrayBuffer = await file.arrayBuffer()
  await r2Bucket.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  // Workers経由の公開URL（R2は直接公開しないため）
  // フロントエンドからは /api/v1/liff/profile/photos/view/{userId}/{index} でアクセス
  const publicUrl = `/api/v1/liff/profile/photos/view/${userId}/${index}`

  return publicUrl
}

/**
 * R2から画像を削除
 */
export async function deletePhotoFromR2(
  r2Bucket: R2Bucket,
  userId: string,
  index: PhotoIndex
): Promise<void> {
  // 可能性のある拡張子をすべて試す
  const extensions = ['.jpg', '.jpeg', '.png', '.webp']
  
  for (const ext of extensions) {
    const filename = `${userId}/${index}${ext}`
    try {
      await r2Bucket.delete(filename)
    } catch (error) {
      // エラーは無視（ファイルが存在しない可能性）
      console.log(`[deletePhotoFromR2] Failed to delete ${filename}`, error)
    }
  }
}

/**
 * データベースのphoto_urls配列を更新（アップロード時）
 */
export async function updatePhotoUrlsInDB(
  supabase: SupabaseClient,
  userId: string,
  index: PhotoIndex,
  url: string
): Promise<string[]> {
  // 現在のphoto_urlsを取得
  const { data: profile, error: fetchError } = await supabase
    .from('talent_profiles')
    .select('photo_urls')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch profile: ${fetchError.message}`)
  }

  // 配列を準備
  const photoUrls: string[] = profile?.photo_urls || []
  
  // 指定されたインデックスにURLを設定
  photoUrls[index] = url

  // データベースを更新
  const { data, error } = await supabase
    .from('talent_profiles')
    .update({ photo_urls: photoUrls })
    .eq('user_id', userId)
    .select('photo_urls')
    .single()

  if (error) {
    throw new Error(`Failed to update photo_urls: ${error.message}`)
  }

  return data.photo_urls || []
}

/**
 * データベースのphoto_urls配列を更新（削除時）
 */
export async function deletePhotoUrlFromDB(
  supabase: SupabaseClient,
  userId: string,
  index: PhotoIndex
): Promise<string[]> {
  // 現在のphoto_urlsを取得
  const { data: profile, error: fetchError } = await supabase
    .from('talent_profiles')
    .select('photo_urls')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch profile: ${fetchError.message}`)
  }

  const photoUrls: string[] = profile?.photo_urls || []
  
  // 指定されたインデックスを削除（空文字に設定）
  photoUrls[index] = ''

  // データベースを更新
  const { data, error } = await supabase
    .from('talent_profiles')
    .update({ photo_urls: photoUrls })
    .eq('user_id', userId)
    .select('photo_urls')
    .single()

  if (error) {
    throw new Error(`Failed to update photo_urls: ${error.message}`)
  }

  return data.photo_urls || []
}

/**
 * 写真URL一覧を取得
 */
export async function getPhotoUrls(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('talent_profiles')
    .select('photo_urls')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch photo_urls: ${error.message}`)
  }

  return data?.photo_urls || []
}
