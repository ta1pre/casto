/**
 * オーディションメインビジュアルAPI
 * [SF][REH] メインビジュアルのアップロード・削除・配信エンドポイント
 */

import { Hono } from 'hono'
import { createSupabaseClient } from '../../../lib/supabase'
import type { AppBindings } from '../../../types'
import {
  uploadMainVisualToR2,
  deleteMainVisualFromR2,
  updateMainVisualInDB,
  deleteMainVisualFromDB,
} from './mainVisual.service'

const mainVisualRoutes = new Hono<AppBindings>()

/**
 * POST /api/v1/organizer/auditions/:id/main-visual/upload
 * メインビジュアルアップロード
 */
mainVisualRoutes.post('/:id/main-visual/upload', async (c) => {
  try {
    // 認証チェック
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401)
    }

    const auditionId = c.req.param('id')

    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    // オーディションの存在確認と権限チェック
    const supabase = createSupabaseClient(c)
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select('id, organizer_id')
      .eq('id', auditionId)
      .single()

    if (auditionError || !audition) {
      return c.json({ error: 'オーディションが見つかりません' }, 404)
    }

    if (audition.organizer_id !== user.id) {
      return c.json({ error: 'このオーディションを編集する権限がありません' }, 403)
    }

    // リクエストボディの取得
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return c.json({ error: 'fileは必須です' }, 400)
    }

    // R2にアップロード
    const { url, mediaType } = await uploadMainVisualToR2(r2Bucket, auditionId, file)

    // データベースを更新
    await updateMainVisualInDB(supabase, auditionId, url, mediaType)

    return c.json({
      success: true,
      url,
      mediaType,
      message: 'メインビジュアルをアップロードしました'
    }, 200)
  } catch (error) {
    console.error('[MainVisualAPI] Upload error:', error)
    return c.json({
      error: 'アップロードに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * DELETE /api/v1/organizer/auditions/:id/main-visual
 * メインビジュアル削除
 */
mainVisualRoutes.delete('/:id/main-visual', async (c) => {
  try {
    // 認証チェック
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401)
    }

    const auditionId = c.req.param('id')

    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    // オーディションの存在確認と権限チェック
    const supabase = createSupabaseClient(c)
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select('id, organizer_id')
      .eq('id', auditionId)
      .single()

    if (auditionError || !audition) {
      return c.json({ error: 'オーディションが見つかりません' }, 404)
    }

    if (audition.organizer_id !== user.id) {
      return c.json({ error: 'このオーディションを編集する権限がありません' }, 403)
    }

    // R2から削除
    await deleteMainVisualFromR2(r2Bucket, auditionId)

    // データベースを更新
    await deleteMainVisualFromDB(supabase, auditionId)

    return c.json({
      success: true,
      message: 'メインビジュアルを削除しました'
    }, 200)
  } catch (error) {
    console.error('[MainVisualAPI] Delete error:', error)
    return c.json({
      error: '削除に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/v1/organizer/auditions/:id/main-visual/view
 * メインビジュアルを配信（R2から取得）
 */
mainVisualRoutes.get('/:id/main-visual/view', async (c) => {
  try {
    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    const auditionId = c.req.param('id')
    
    // クエリパラメータでバージョンを取得（キャッシュバスティング用）
    const version = c.req.query('v')

    // 可能性のある拡張子を試す（画像・動画両方）
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm']
    
    for (const ext of extensions) {
      const filename = `auditions/${auditionId}/main-visual${ext}`
      const object = await r2Bucket.get(filename)
      
      if (object) {
        // キャッシュ戦略: バージョンパラメータがあれば長期キャッシュ、なければ短期
        const cacheControl = version 
          ? 'public, max-age=31536000, immutable' // 1年キャッシュ（バージョン付き）
          : 'public, max-age=300' // 5分キャッシュ（バージョンなし）
        
        // メディアを返す
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': cacheControl,
            'ETag': `"${auditionId}-${ext}-${version || 'latest'}"`,
          },
        })
      }
    }

    // メディアが見つからない
    return c.json({ error: 'メインビジュアルが見つかりません' }, 404)
  } catch (error) {
    console.error('[MainVisualAPI] View error:', error)
    return c.json({
      error: 'メインビジュアルの取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default mainVisualRoutes
