/**
 * オーディションメインビジュアルアップロード・削除サービス
 * [SF][REH] R2ストレージとの連携処理（logoパターンを踏襲）
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { validateMedia, getMediaExtension, detectMediaType } from '@casto/shared/validators/media'
import type { MediaType } from '@casto/shared/types/media'

/**
 * R2にメインビジュアルをアップロード
 */
export async function uploadMainVisualToR2(
  r2Bucket: R2Bucket,
  auditionId: string,
  file: File | Blob
): Promise<{ url: string; mediaType: MediaType }> {
  // バリデーション
  const validation = validateMedia(file)
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message || 'Invalid media file')
  }

  if (!validation.mediaType) {
    throw new Error('Could not detect media type')
  }

  // 既存のメインビジュアルをすべて削除（上書き前のクリーンアップ）
  await deleteMainVisualFromR2(r2Bucket, auditionId)

  // ファイル名生成（auditionsディレクトリ配下）
  const extension = getMediaExtension(file)
  const filename = `auditions/${auditionId}/main-visual${extension}`

  // R2にアップロード
  const arrayBuffer = await file.arrayBuffer()
  await r2Bucket.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  })

  // Workers経由の公開URL（キャッシュバスティング用のタイムスタンプ付き）
  const timestamp = Date.now()
  const publicUrl = `/api/v1/organizer/auditions/${auditionId}/main-visual/view?v=${timestamp}`

  return {
    url: publicUrl,
    mediaType: validation.mediaType
  }
}

/**
 * R2からメインビジュアルを削除
 */
export async function deleteMainVisualFromR2(
  r2Bucket: R2Bucket,
  auditionId: string
): Promise<void> {
  // 可能性のある拡張子をすべて試す
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm']
  
  for (const ext of extensions) {
    const filename = `auditions/${auditionId}/main-visual${ext}`
    try {
      await r2Bucket.delete(filename)
    } catch (error) {
      // エラーは無視（ファイルが存在しない可能性）
      console.log(`[deleteMainVisualFromR2] Failed to delete ${filename}`, error)
    }
  }
}

/**
 * データベースのmain_visual_url/typeを更新（アップロード時）
 */
export async function updateMainVisualInDB(
  supabase: SupabaseClient,
  auditionId: string,
  url: string,
  mediaType: MediaType
): Promise<{ url: string; mediaType: MediaType }> {
  const { data, error } = await supabase
    .from('auditions')
    .update({ 
      main_visual_url: url,
      main_visual_type: mediaType
    })
    .eq('id', auditionId)
    .select('main_visual_url, main_visual_type')
    .single()

  if (error) {
    throw new Error(`Failed to update main_visual: ${error.message}`)
  }

  return {
    url: data.main_visual_url || '',
    mediaType: data.main_visual_type as MediaType
  }
}

/**
 * データベースのmain_visual_url/typeを削除
 */
export async function deleteMainVisualFromDB(
  supabase: SupabaseClient,
  auditionId: string
): Promise<void> {
  const { error } = await supabase
    .from('auditions')
    .update({ 
      main_visual_url: null,
      main_visual_type: null
    })
    .eq('id', auditionId)

  if (error) {
    throw new Error(`Failed to delete main_visual: ${error.message}`)
  }
}
