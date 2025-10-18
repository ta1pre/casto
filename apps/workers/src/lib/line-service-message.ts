/**
 * LINEサービスメッセージ送信サービス
 * [CA][REH] LINE Messaging API準拠のサービスメッセージ送信
 */

import { SignJWT } from 'jose'
import type { Bindings } from '../types/bindings'
import type {
  IssueServiceNotificationTokenRequest,
  IssueServiceNotificationTokenResponse,
  SendServiceMessageRequest,
  SendServiceMessageResponse,
  LineApiError
} from '@casto/shared/types/lineServiceMessage'

const LINE_NOTIFIER_API_BASE = 'https://api.line.me/message/v3'
const LINE_OAUTH_API_BASE = 'https://api.line.me/oauth2/v3'

/**
 * ステートレスチャネルアクセストークンを生成
 * LINEミニアプリでは長期トークンが使えないため、動的に生成する
 * @param env - 環境変数
 * @returns ステートレスチャネルアクセストークン（15分間有効）
 */
async function getChannelAccessToken(env: Bindings): Promise<string> {
  const channelId = env.LINE_CHANNEL_ID
  const channelSecret = env.LINE_CHANNEL_SECRET

  if (!channelId || !channelSecret) {
    throw new Error('LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are required')
  }

  console.log('[Stateless Token] Generating token for channel:', channelId)

  // JWTペイロード作成
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: channelId,
    sub: channelId,
    aud: 'https://api.line.me/',
    exp: now + 60 * 30, // 30分後
    token_exp: 60 * 15 // トークン有効期限: 15分
  }

  // JWT署名（HS256アルゴリズム）
  const secret = new TextEncoder().encode(channelSecret)
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setIssuer(channelId)
    .setSubject(channelId)
    .setAudience('https://api.line.me/')
    .setExpirationTime(now + 60 * 30)
    .sign(secret)

  console.log('[Stateless Token] JWT generated, length:', jwt.length)

  // ステートレスチャネルアクセストークン発行API
  const response = await fetch(`${LINE_OAUTH_API_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: jwt
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Stateless Token] Error:', response.status, errorText)
    throw new Error(`Failed to issue stateless channel access token: HTTP ${response.status} - ${errorText}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number; token_type: string }
  console.log('[Stateless Token] Token issued successfully, expires_in:', data.expires_in)
  
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
