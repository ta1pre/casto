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
 * チャネルアクセストークンのキャッシュ
 * 
 * チャネルアクセストークンは全ユーザーで共有されるアプリ認証用トークンなので、
 * メモリにキャッシュして再利用することでパフォーマンスを向上させます。
 * 
 * - トークンは30日間有効だが、29日でキャッシュを期限切れにして安全マージンを確保
 * - Workerが再起動されるとキャッシュは失われるが、その場合は自動的に再発行される
 * - LINE APIの30件発行制限を回避
 */
let cachedChannelAccessToken: {
  token: string
  expiresAt: number
} | null = null

/**
 * 短期のチャネルアクセストークンを発行（キャッシュ付き）
 * 
 * LINEミニアプリでは長期トークンが使用できないため、
 * チャネルIDとシークレットを使用して短期トークン（30日間有効）を動的に生成します。
 * 
 * パフォーマンス最適化のため、発行したトークンを29日間メモリにキャッシュします。
 * チャネルアクセストークンは全ユーザーで共有されるアプリ認証用トークンなので、
 * キャッシュによる再利用が可能です。
 * 
 * @param env - 環境変数（LINE_CHANNEL_ID, LINE_CHANNEL_SECRETが必要）
 * @returns 短期のチャネルアクセストークン（30日間有効、最大30件まで発行可能）
 * @throws {Error} 環境変数が未設定、またはAPI呼び出しが失敗した場合
 */
async function getChannelAccessToken(env: Bindings): Promise<string> {
  const now = Date.now()
  
  // キャッシュが有効期限内なら再利用
  if (cachedChannelAccessToken && cachedChannelAccessToken.expiresAt > now) {
    console.log('[LINE] Using cached channel access token (expires in', 
      Math.floor((cachedChannelAccessToken.expiresAt - now) / 1000 / 60 / 60 / 24), 'days)')
    return cachedChannelAccessToken.token
  }
  
  // キャッシュがない、または期限切れなら新規発行
  const channelId = env.LINE_CHANNEL_ID
  const channelSecret = env.LINE_CHANNEL_SECRET

  if (!channelId || !channelSecret) {
    throw new Error('LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are required')
  }

  console.log('[LINE] Issuing short-lived channel access token for channel:', channelId)

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
    console.error('[LINE] Failed to issue channel access token:', response.status, errorText)
    throw new Error(`Failed to issue channel access token: HTTP ${response.status} - ${errorText}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number; token_type: string }
  console.log('[LINE] Channel access token issued successfully (expires in', data.expires_in, 'seconds)')
  
  // キャッシュに保存（29日間）
  const cacheExpiryMs = 29 * 24 * 60 * 60 * 1000 // 29日
  cachedChannelAccessToken = {
    token: data.access_token,
    expiresAt: now + cacheExpiryMs
  }
  console.log('[LINE] Channel access token cached for 29 days')
  
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
