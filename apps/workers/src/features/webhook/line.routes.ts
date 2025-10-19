/**
 * LINE Webhook API ルート
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 * 
 * POST /api/v1/webhook/line
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../types'
import { createSupabaseClient } from '../../lib/supabase'
import {
  verifySignature,
  handleWebhookEvents,
  type WebhookRequestBody
} from './line.service'

const router = new Hono<AppBindings>()

/**
 * LINE Webhook エンドポイント
 * 
 * LINEプラットフォームから呼ばれるWebhookです。
 * 友だち追加/ブロック/解除イベントを受け取り、DBに記録します。
 * 
 * セキュリティ:
 * - Webhook署名検証必須（HMAC-SHA256）[SFT]
 * - 署名が無効な場合は401を返す
 * 
 * @route POST /api/v1/webhook/line
 */
router.post('/', async (c) => {
  const env = c.env

  try {
    // 1. Webhook署名検証 [SFT]
    const signature = c.req.header('x-line-signature')
    if (!signature) {
      console.error('[Webhook] Missing x-line-signature header')
      return c.json({ error: 'Signature verification failed' }, 401)
    }

    const channelSecret = env.LINE_MESSAGING_CHANNEL_SECRET
    if (!channelSecret) {
      console.error('[Webhook] LINE_MESSAGING_CHANNEL_SECRET not configured')
      return c.json({ error: 'Server configuration error' }, 500)
    }

    // リクエストボディを文字列として取得（署名検証に必要）
    const bodyText = await c.req.text()
    
    // 署名検証
    if (!verifySignature(bodyText, signature, channelSecret)) {
      console.error('[Webhook] Invalid signature')
      return c.json({ error: 'Signature verification failed' }, 401)
    }

    // 2. リクエストボディをパース
    let body: WebhookRequestBody
    try {
      body = JSON.parse(bodyText) as WebhookRequestBody
    } catch (parseError) {
      console.error('[Webhook] Invalid JSON body:', parseError)
      return c.json({ error: 'Invalid request body' }, 400)
    }

    // 3. イベント処理
    const supabase = createSupabaseClient(c)
    await handleWebhookEvents(body.events, supabase)

    console.log(`[Webhook] Successfully processed ${body.events.length} events`)

    // 4. 成功レスポンス（LINEプラットフォームは200を期待）
    return c.json({ success: true })
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error)
    // エラーでも200を返す（LINEの再送信を防ぐため）[REH]
    return c.json({ success: false, error: 'Internal server error' }, 200)
  }
})

export default router
