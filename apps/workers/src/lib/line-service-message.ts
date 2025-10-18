/**
 * LINEサービスメッセージ送信サービス
 * [CA][REH] LINE Messaging API準拠のサービスメッセージ送信
 */

import type { Bindings } from '../types/bindings'
import type {
  IssueServiceNotificationTokenRequest,
  IssueServiceNotificationTokenResponse,
  SendServiceMessageRequest,
  SendServiceMessageResponse,
  LineApiError
} from '@casto/shared/types/lineServiceMessage'

const LINE_NOTIFIER_API_BASE = 'https://api.line.me/message/v3'

/**
 * 短期のチャネルアクセストークンを発行
 * LINEミニアプリでは長期トークンが使えないため、短期トークンを動的に発行
 * @param env - 環境変数
 * @returns 短期のチャネルアクセストークン（30日間有効）
 */
async function getChannelAccessToken(env: Bindings): Promise<string> {
  const channelId = env.LINE_CHANNEL_ID
  const channelSecret = env.LINE_CHANNEL_SECRET

  if (!channelId || !channelSecret) {
    throw new Error('LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are required')
  }

  console.log('[Channel Token] Issuing short-lived token for channel:', channelId)

  // 短期のチャネルアクセストークン発行API
  const response = await fetch('https://api.line.me/v2/oauth/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: channelId,
      client_secret: channelSecret
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Channel Token] Error:', response.status, errorText)
    throw new Error(`Failed to issue channel access token: HTTP ${response.status} - ${errorText}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number; token_type: string }
  console.log('[Channel Token] Token issued successfully, expires_in:', data.expires_in)
  
  return data.access_token
}

/**
 * サービス通知トークンを発行
 * @param liffAccessToken - LIFFアクセストークン（liff.getAccessToken()で取得）
 * @param env - 環境変数
 * @returns サービス通知トークンと残り送信可能回数
 */
export async function issueServiceNotificationToken(
  liffAccessToken: string,
  env: Bindings
): Promise<IssueServiceNotificationTokenResponse> {
  const channelAccessToken = await getChannelAccessToken(env)

  const response = await fetch(`${LINE_NOTIFIER_API_BASE}/notifier/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      liffAccessToken
    } as IssueServiceNotificationTokenRequest)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[LINE API Error] Status:', response.status)
    console.error('[LINE API Error] Response:', errorText)
    let error: LineApiError
    try {
      error = JSON.parse(errorText)
    } catch {
      throw new Error(`Failed to issue service notification token: HTTP ${response.status} - ${errorText}`)
    }
    throw new Error(`Failed to issue service notification token: ${error.message} (detail: ${JSON.stringify(error)})`)
  }

  const data = await response.json() as { notificationToken: string; remainingCount: number }
  return {
    notificationToken: data.notificationToken,
    remainingCount: data.remainingCount
  }
}

/**
 * サービスメッセージを送信
 * @param request - 送信リクエスト（テンプレート名、通知トークン、変数）
 * @param env - 環境変数
 * @returns 送信結果と新しい通知トークン（後続メッセージ用）
 */
export async function sendServiceMessage(
  request: SendServiceMessageRequest,
  env: Bindings
): Promise<SendServiceMessageResponse> {
  const channelAccessToken = await getChannelAccessToken(env)

  const response = await fetch(`${LINE_NOTIFIER_API_BASE}/notifier/send?target=service`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      templateName: request.templateName,
      notificationToken: request.notificationToken,
      params: request.params || {}
    })
  })

  if (!response.ok) {
    const error: LineApiError = await response.json()
    throw new Error(`Failed to send service message: ${error.message}`)
  }

  const data = await response.json() as { notificationToken: string; remainingCount: number }
  return {
    status: 'success',
    notificationToken: data.notificationToken,
    remainingCount: data.remainingCount
  }
}

/**
 * 応募者へのサービスメッセージ送信（フルフロー）
 * @param liffAccessToken - LIFFアクセストークン
 * @param templateName - テンプレート名
 * @param params - テンプレート変数
 * @param env - 環境変数
 * @returns 送信結果と新しい通知トークン
 */
export async function sendServiceMessageWithToken(
  liffAccessToken: string,
  templateName: string,
  params: Record<string, string>,
  env: Bindings
): Promise<SendServiceMessageResponse> {
  // 1. サービス通知トークンを発行
  const tokenResponse = await issueServiceNotificationToken(liffAccessToken, env)

  // 2. サービスメッセージを送信
  const sendResponse = await sendServiceMessage(
    {
      templateName,
      notificationToken: tokenResponse.notificationToken,
      params
    },
    env
  )

  return sendResponse
}
