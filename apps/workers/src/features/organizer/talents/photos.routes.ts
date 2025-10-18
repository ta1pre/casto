/**
 * 主催者用タレント写真閲覧API
 * [SFT][CA] 主催者認証で写真を閲覧可能にする
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../../types'
import { verifyOrganizerAuth } from '../../../middleware/verifyRoleAuth'

const photosRoutes = new Hono<AppBindings>()

/**
 * GET /api/v1/organizer/talents/photos/:userId/:index
 * タレント写真を配信（R2から取得）
 * 主催者認証が必要
 */
photosRoutes.get('/:userId/:index', verifyOrganizerAuth, async (c) => {
  try {
    // R2バケットの取得
    const r2Bucket = c.env.TALENT_PHOTOS
    if (!r2Bucket) {
      return c.json({ error: 'R2バケットが設定されていません' }, 500)
    }

    const userId = c.req.param('userId')
    const index = parseInt(c.req.param('index'), 10)

    if (isNaN(index) || index < 0 || index > 5) {
      return c.json({ error: '無効なindexです' }, 400)
    }

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
    console.error('[OrganizerPhotosAPI] View photo error:', error)
    return c.json({
      error: '画像の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default photosRoutes
