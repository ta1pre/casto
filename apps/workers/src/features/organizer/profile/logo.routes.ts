/**
 * 主催者ロゴアップロードAPI
 * [SF][REH] ロゴのアップロード・削除・取得エンドポイント
 */

import { Hono } from 'hono'
import { createSupabaseClient } from '../../../lib/supabase'
import type { AppBindings } from '../../../types'
import {
  uploadLogoToR2,
  deleteLogoFromR2,
  updateLogoUrlInDB,
  deleteLogoUrlFromDB,
} from './logo.service'

const logoRoutes = new Hono<AppBindings>()

/**
 * POST /api/v1/organizer/profile/logo/upload
 * ロゴアップロード
 */
logoRoutes.post('/upload', async (c) => {
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

    if (!file) {
      return c.json({ error: 'fileは必須です' }, 400)
    }

    // R2にアップロード
    const url = await uploadLogoToR2(r2Bucket, user.id, file)

    // データベースを更新
    const supabase = createSupabaseClient(c)
    const logoUrl = await updateLogoUrlInDB(supabase, user.id, url)

    return c.json({
      success: true,
      url: logoUrl,
      message: 'ロゴをアップロードしました'
    }, 200)
  } catch (error) {
    console.error('[LogoAPI] Upload error:', error)
    return c.json({
      error: 'アップロードに失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * DELETE /api/v1/organizer/profile/logo
 * ロゴ削除
 */
logoRoutes.delete('/', async (c) => {
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

    // R2から削除
    await deleteLogoFromR2(r2Bucket, user.id)

    // データベースを更新
    const supabase = createSupabaseClient(c)
    const logoUrl = await deleteLogoUrlFromDB(supabase, user.id)

    return c.json({
      success: true,
      logoUrl,
      message: 'ロゴを削除しました'
    }, 200)
  } catch (error) {
    console.error('[LogoAPI] Delete error:', error)
    return c.json({
      error: '削除に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/v1/organizer/profile/logo/view/:organizerId
 * ロゴ画像を配信（R2から取得）
 */
logoRoutes.get('/view/:organizerId', async (c) => {
  try {
    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    const organizerId = c.req.param('organizerId')
    
    // クエリパラメータでバージョンを取得（キャッシュバスティング用）
    const version = c.req.query('v')

    // 可能性のある拡張子を試す
    const extensions = ['.jpg', '.jpeg', '.png', '.webp']
    
    for (const ext of extensions) {
      const filename = `organizers/${organizerId}/logo${ext}`
      const object = await r2Bucket.get(filename)
      
      if (object) {
        // キャッシュ戦略: バージョンパラメータがあれば長期キャッシュ、なければ短期
        const cacheControl = version 
          ? 'public, max-age=31536000, immutable' // 1年キャッシュ（バージョン付き）
          : 'public, max-age=300' // 5分キャッシュ（バージョンなし）
        
        // 画像を返す
        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control': cacheControl,
            'ETag': `"${organizerId}-${ext}-${version || 'latest'}"`,
          },
        })
      }
    }

    // 画像が見つからない
    return c.json({ error: '画像が見つかりません' }, 404)
  } catch (error) {
    console.error('[LogoAPI] View logo error:', error)
    return c.json({
      error: '画像の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default logoRoutes
