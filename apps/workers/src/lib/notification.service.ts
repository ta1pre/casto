/**
 * 通知サービス（ディスパッチャ）
 * [CA][REH][DRY] 通知の生成・保存・送信を統合管理
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bindings } from '../types/bindings'
import type { NotificationType } from '@casto/shared/types/notification'
import { notificationTemplates } from '../config/notification-templates'
import { sendServiceMessageWithToken } from './line-service-message'

/**
 * 通知作成リクエスト
 */
export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  context: Record<string, any>
  referenceType?: 'audition' | 'application'
  referenceId?: string
  liffAccessToken?: string  // LINEサービスメッセージ送信用
}

/**
 * 通知作成結果
 */
export interface CreateNotificationResult {
  notificationId: string
  channel: 'line' | 'email' | 'in_app'
  sent: boolean
  error?: string
}

/**
 * 通知を作成し、適切なチャネルで送信
 * @param params - 通知作成パラメータ
 * @param supabase - Supabaseクライアント
 * @param env - 環境変数
 * @returns 通知作成結果
 */
export async function createNotification(
  params: CreateNotificationParams,
  supabase: SupabaseClient,
  env: Bindings
): Promise<CreateNotificationResult> {
  const { userId, type, context, referenceType, referenceId, liffAccessToken } = params

  // テンプレート取得
  const template = notificationTemplates[type]
  if (!template) {
    throw new Error(`Notification template not found for type: ${type}`)
  }

  // タイトル・メッセージ生成
  const title = template.title
  const message = template.message(context)

  // チャネル判定（LINEアクセストークンがあればLINE、なければin_app）
  const channel = liffAccessToken ? 'line' : 'in_app'

  // notificationsテーブルに登録
  const { data: notification, error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      reference_type: referenceType,
      reference_id: referenceId,
      context,
      channel
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to insert notification: ${insertError.message}`)
  }

  let sent = false
  let errorMessage: string | undefined

  // LINEサービスメッセージ送信
  if (channel === 'line' && liffAccessToken) {
    try {
      const liffId = env.LINE_LIFF_ID || ''
      const params = template.params ? template.params(context, liffId) : {}
      
      const result = await sendServiceMessageWithToken(
        liffAccessToken,
        template.templateName,
        params,
        env
      )

      // 後続メッセージ用の通知トークンを保存
      if (result.notificationToken) {
        await supabase
          .from('notifications')
          .update({ service_notification_token: result.notificationToken })
          .eq('id', notification.id)
      }

      sent = true
      console.log('[Notification] LINE service message sent successfully')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      // 未認証ミニアプリでは403エラーが発生する（認証審査通過後に自動解決）
      if (errorMsg.includes('Unlicensed API Request')) {
        console.warn('[Notification] LINE service message is disabled (unauthenticated mini app)')
      } else {
        console.error('[Notification] Failed to send LINE service message:', error)
      }
      
      errorMessage = errorMsg
      sent = false
    }
  }

  return {
    notificationId: notification.id,
    channel,
    sent,
    error: errorMessage
  }
}

/**
 * べき等性チェック（同一イベントの二重送信防止）
 * @param userId - ユーザーID
 * @param type - 通知タイプ
 * @param referenceId - 参照ID
 * @param supabase - Supabaseクライアント
 * @returns 既に通知が存在する場合true
 */
export async function isNotificationExists(
  userId: string,
  type: NotificationType,
  referenceId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('reference_id', referenceId)
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = Not found（エラーではない）
    throw new Error(`Failed to check notification existence: ${error.message}`)
  }

  return !!data
}
