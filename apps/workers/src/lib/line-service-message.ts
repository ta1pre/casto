/**
 * LINEサービスメッセージ送信サービス
 * 
 * LINE Messaging API v3のサービスメッセージ機能を使用して、
 * ユーザーの操作に対する確認・通知を送信します。
 * 
 * - 短期のチャネルアクセストークン（30日間有効）を動的生成
 * - サービス通知トークンを発行してメッセージ送信
 * - 1つの操作につき最大5回まで送信可能
 * 
 * @see https://developers.line.biz/ja/docs/line-mini-app/develop/service-messages/
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
 * ステートレスチャネルアクセストークンを発行
 * 
 * LINEミニアプリではステートレスチャネルアクセストークンの使用が推奨されます。
 * 
 * メリット:
 * - 発行数無制限（30件制限なし）
 * - 15分で自動失効（セキュリティ向上）
 * - キャッシュ不要（シンプルな実装）
 * 
 * @param env - 環境変数（LINE_CHANNEL_ID, LINE_CHANNEL_SECRETが必要）
 * @returns ステートレスチャネルアクセストークン（15分間有効）
 * @throws {Error} 環境変数が未設定、またはAPI呼び出しが失敗した場合
 */
async function getChannelAccessToken(env: Bindings): Promise<string> {
  const channelId = env.LINE_CHANNEL_ID
  const channelSecret = env.LINE_CHANNEL_SECRET

  if (!channelId || !channelSecret) {
    throw new Error('LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are required')
  }

  console.log('[LINE] Issuing stateless channel access token for channel:', channelId)

  // ステートレスチャネルアクセストークン発行API
  const response = await fetch('https://api.line.me/oauth2/v3/token', {
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
    console.error('[LINE] Failed to issue stateless channel access token:', response.status, errorText)
    throw new Error(`Failed to issue stateless channel access token: HTTP ${response.status} - ${errorText}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number; token_type: string }
  console.log('[LINE] Stateless channel access token issued successfully (expires in', data.expires_in, 'seconds)')
  
  return data.access_token
}

/**
 * サービス通知トークンを発行
 * 
 * LIFFアクセストークンを使用してサービス通知トークンを取得します。
 * このトークンは、実際のサービスメッセージ送信時に使用されます。
 * 
 * @param liffAccessToken - LIFFアクセストークン（フロントエンドでliff.getAccessToken()により取得）
 * @param env - 環境変数
 * @returns サービス通知トークンと残り送信可能回数
 * @throws {Error} API呼び出しが失敗した場合
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
    console.error('[LINE] Failed to issue service notification token:', response.status, errorText)
    let error: LineApiError
    try {
      error = JSON.parse(errorText)
    } catch {
      throw new Error(`Failed to issue service notification token: HTTP ${response.status} - ${errorText}`)
    }
    throw new Error(`Failed to issue service notification token: ${error.message}`)
  }

  const data = await response.json() as { notificationToken: string; remainingCount: number }
  return {
    notificationToken: data.notificationToken,
    remainingCount: data.remainingCount
  }
}

/**
 * サービスメッセージを送信
 * 
 * サービス通知トークンを使用して、指定されたテンプレートでメッセージを送信します。
 * レスポンスには新しい通知トークンが含まれ、後続メッセージ（最大4回）に使用できます。
 * 
 * @param request - 送信リクエスト（テンプレート名、通知トークン、変数）
 * @param env - 環境変数
 * @returns 送信結果と新しい通知トークン（後続メッセージ用）
 * @throws {Error} API呼び出しが失敗した場合
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
    console.error('[LINE] Failed to send service message:', error)
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
 * サービスメッセージ送信（フルフロー）
 * 
 * サービス通知トークンの発行とメッセージ送信を一括で実行します。
 * これは、ユーザーの操作（応募、予約等）に対する最初の通知に使用されます。
 * 
 * @param liffAccessToken - LIFFアクセストークン
 * @param templateName - LINE Developersコンソールで登録したテンプレート名
 * @param params - テンプレート変数（プレースホルダーに展開される値）
 * @param env - 環境変数
 * @returns 送信結果と新しい通知トークン（後続メッセージ用）
 * @throws {Error} トークン発行またはメッセージ送信が失敗した場合
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
