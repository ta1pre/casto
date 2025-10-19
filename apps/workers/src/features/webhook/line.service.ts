/**
 * LINE Webhook処理サービス
 * [SF][REH][DRY] シンプル、堅牢、重複排除
 * 
 * 友だち追加/ブロック/解除イベントをDBに記録
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

/**
 * LINE Webhook イベント型定義
 */
export interface WebhookEvent {
  type: 'follow' | 'unfollow' | 'message' | 'postback' | string
  timestamp: number
  source: {
    type: 'user' | 'group' | 'room'
    userId?: string
    groupId?: string
    roomId?: string
  }
  replyToken?: string
  mode?: 'active' | 'standby'
}

export interface WebhookRequestBody {
  destination: string
  events: WebhookEvent[]
}

/**
 * Webhook署名検証
 * 
 * LINEプラットフォームからのリクエストが正当であることを確認します。
 * セキュリティ上重要な処理です。[SFT]
 * 
 * @param body - リクエストボディ（文字列）
 * @param signature - x-line-signatureヘッダーの値
 * @param channelSecret - LINEチャネルシークレット
 * @returns 署名が有効な場合true
 */
export function verifySignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const hash = createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64')
  
  return hash === signature
}

/**
 * Webhookイベント処理（メインハンドラー）
 * 
 * @param events - Webhookイベント配列
 * @param supabase - Supabaseクライアント
 */
export async function handleWebhookEvents(
  events: WebhookEvent[],
  supabase: SupabaseClient
): Promise<void> {
  for (const event of events) {
    try {
      switch (event.type) {
        case 'follow':
          await handleFollowEvent(event, supabase)
          break
        case 'unfollow':
          await handleUnfollowEvent(event, supabase)
          break
        // その他のイベントは無視
        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error(`[Webhook] Error handling event:`, error)
      // 個別のイベント処理エラーは握りつぶさず、ログのみ出力して継続 [REH]
    }
  }
}

/**
 * 友だち追加イベント処理
 * 
 * LINE公式アカウントに友だち追加された時に呼ばれます。
 * 
 * @param event - 友だち追加イベント
 * @param supabase - Supabaseクライアント
 */
async function handleFollowEvent(
  event: WebhookEvent,
  supabase: SupabaseClient
): Promise<void> {
  const lineUserId = event.source.userId
  
  if (!lineUserId) {
    console.warn('[Webhook] Follow event without userId')
    return
  }

  console.log(`[Webhook] User followed: ${lineUserId}`)

  // line_user_idでusersテーブルを検索し、友だち追加状態を更新
  const { data: user, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('line_user_id', lineUserId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116 = Not found（エラーではない）
    throw new Error(`Failed to find user: ${selectError.message}`)
  }

  if (!user) {
    console.warn(`[Webhook] User not found for line_user_id: ${lineUserId}`)
    // ユーザーが見つからない場合はスキップ（LIFF初回ログイン前の友だち追加など）
    return
  }

  // 友だち追加状態を true に更新
  const { error: updateError } = await supabase
    .from('users')
    .update({
      line_friendship_status: true,
      line_friendship_updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    throw new Error(`Failed to update friendship status: ${updateError.message}`)
  }

  console.log(`[Webhook] Updated friendship status to true for user: ${user.id}`)
}

/**
 * ブロック/友だち解除イベント処理
 * 
 * LINE公式アカウントをブロック、または友だち削除された時に呼ばれます。
 * 
 * @param event - ブロック/友だち解除イベント
 * @param supabase - Supabaseクライアント
 */
async function handleUnfollowEvent(
  event: WebhookEvent,
  supabase: SupabaseClient
): Promise<void> {
  const lineUserId = event.source.userId
  
  if (!lineUserId) {
    console.warn('[Webhook] Unfollow event without userId')
    return
  }

  console.log(`[Webhook] User unfollowed: ${lineUserId}`)

  // line_user_idでusersテーブルを検索し、友だち追加状態を更新
  const { data: user, error: selectError } = await supabase
    .from('users')
    .select('id')
    .eq('line_user_id', lineUserId)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(`Failed to find user: ${selectError.message}`)
  }

  if (!user) {
    console.warn(`[Webhook] User not found for line_user_id: ${lineUserId}`)
    return
  }

  // 友だち追加状態を false に更新
  const { error: updateError } = await supabase
    .from('users')
    .update({
      line_friendship_status: false,
      line_friendship_updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    throw new Error(`Failed to update friendship status: ${updateError.message}`)
  }

  console.log(`[Webhook] Updated friendship status to false for user: ${user.id}`)
}
