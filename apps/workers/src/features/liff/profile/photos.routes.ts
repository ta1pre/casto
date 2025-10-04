/**
 * 写真アップロードAPI
 * 
 * [SF][REH] 写真のアップロード・削除・取得エンドポイント
 */

import { Hono } from 'hono'
import { createSupabaseClient } from '../../../lib/supabase'
import type { AppBindings } from '../../../types'
import type { PhotoIndex } from '@casto/shared'
import {
  uploadPhotoToR2,
  deletePhotoFromR2,
  updatePhotoUrlsInDB,
  deletePhotoUrlFromDB,
  getPhotoUrls,
} from './photos.service'

const photosRoutes = new Hono<AppBindings>()

/**
 * POST /api/v1/liff/profile/photos/upload
 * 写真アップロード
 */
photosRoutes.post('/upload', async (c) => {
  try {
    // 認証チェック
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401)
    }

    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    // リクエストボディの取得
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    const indexStr = formData.get('index') as string | null

    if (!file || !indexStr) {
      return c.json({ error: 'fileとindexは必須です' }, 400)
    }

    const index = parseInt(indexStr, 10) as PhotoIndex
    if (isNaN(index) || index < 0 || index > 5) {
      return c.json({ error: '無効なindexです（0-5の範囲で指定してください）' }, 400)
    }

    // R2にアップロード
    const url = await uploadPhotoToR2(r2Bucket, user.id, index, file)

    // データベースを更新
    const supabase = createSupabaseClient(c)
    const photoUrls = await updatePhotoUrlsInDB(supabase, user.id, index, url)

    return c.json({
      success: true,
      url,
      index,
      photoUrls,
      message: '写真をアップロードしました'
    }, 200)
  } catch (error) {
    console.error('[PhotosAPI] Upload error:', error)
    return c.json({
      error: 'アップロードに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * DELETE /api/v1/liff/profile/photos/:index
 * 写真削除
 */
photosRoutes.delete('/:index', async (c) => {
  try {
    // 認証チェック
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401)
    }

    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    // インデックスの取得
    const indexStr = c.req.param('index')
    const index = parseInt(indexStr, 10) as PhotoIndex
    
    if (isNaN(index) || index < 0 || index > 5) {
      return c.json({ error: '無効なindexです（0-5の範囲で指定してください）' }, 400)
    }

    // R2から削除
    await deletePhotoFromR2(r2Bucket, user.id, index)

    // データベースを更新
    const supabase = createSupabaseClient(c)
    const photoUrls = await deletePhotoUrlFromDB(supabase, user.id, index)

    return c.json({
      success: true,
      index,
      photoUrls,
      message: '写真を削除しました'
    }, 200)
  } catch (error) {
    console.error('[PhotosAPI] Delete error:', error)
    return c.json({
      error: '削除に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/v1/liff/profile/photos
 * 写真一覧取得
 */
photosRoutes.get('/', async (c) => {
  try {
    // 認証チェック
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401)
    }

    // データベースから取得
    const supabase = createSupabaseClient(c)
    const photoUrls = await getPhotoUrls(supabase, user.id)

    return c.json({
      photos: photoUrls,
      count: photoUrls.filter(url => url && url.length > 0).length
    }, 200)
  } catch (error) {
    console.error('[PhotosAPI] Get photos error:', error)
    return c.json({
      error: '写真一覧の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/v1/liff/profile/photos/view/:userId/:index
 * 画像を配信（R2から取得）
 */
photosRoutes.get('/view/:userId/:index', async (c) => {
  try {
    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    const userId = c.req.param('userId')
    const index = parseInt(c.req.param('index'), 10)

    // 可能性のある拡張子を試す
    const extensions = ['.jpg', '.jpeg', '.png', '.webp']
    
    for (const ext of extensions) {
      const filename = `${userId}/${index}${ext}`
      const object = await r2Bucket.get(filename)
      
      if (object) {
        // 画像を返す
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000', // 1年キャッシュ
          },
        })
      }
    }

    // 画像が見つからない
    return c.json({ error: '画像が見つかりません' }, 404)
  } catch (error) {
    console.error('[PhotosAPI] View photo error:', error)
    return c.json({
      error: '画像の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default photosRoutes
