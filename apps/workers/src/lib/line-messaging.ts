/**
 * LINE Messaging API ラッパー
 * [SF][PA][DRY] シンプル、パフォーマンス、重複排除
 * 
 * プッシュメッセージ、マルチキャスト送信、メッセージテンプレート生成
 * 
 * @see https://developers.line.biz/ja/reference/messaging-api/
 */

import type { Bindings } from '../types/bindings'
import type {
  LineMessage,
  LineTextMessage,
  LineFlexMessage,
  PushMessageRequest,
  MulticastMessageRequest
} from '../types/lineMessaging'

const LINE_MESSAGING_API_BASE = 'https://api.line.me/v2/bot'

/**
 * ステートレスチャネルアクセストークンを発行
 * 
 * line-service-message.tsと同じロジックを使用 [DRY]
 * 
 * @param env - 環境変数
 * @returns チャネルアクセストークン（15分間有効）
 */
async function getChannelAccessToken(env: Bindings): Promise<string> {
  const channelId = env.LINE_CHANNEL_ID
  const channelSecret = env.LINE_CHANNEL_SECRET

  if (!channelId || !channelSecret) {
    throw new Error('LINE_CHANNEL_ID and LINE_CHANNEL_SECRET are required')
  }

  console.log('[Messaging] Issuing stateless channel access token')

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
    console.error('[Messaging] Failed to issue token:', response.status, errorText)
    throw new Error(`Failed to issue channel access token: HTTP ${response.status}`)
  }

  const data = await response.json() as { access_token: string }
  return data.access_token
}

/**
 * プッシュメッセージ送信（単一ユーザー）
 * 
 * @param lineUserId - LINE User ID
 * @param messages - 送信するメッセージ（最大5件）
 * @param env - 環境変数
 */
export async function sendPushMessage(
  lineUserId: string,
  messages: LineMessage[],
  env: Bindings
): Promise<void> {
  const token = await getChannelAccessToken(env)

  const requestBody: PushMessageRequest = {
    to: lineUserId,
    messages
  }

  const response = await fetch(`${LINE_MESSAGING_API_BASE}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Messaging] Failed to send push message:', response.status, errorText)
    throw new Error(`Failed to send push message: HTTP ${response.status}`)
  }

  console.log(`[Messaging] Push message sent to user: ${lineUserId}`)
}

/**
 * マルチキャスト送信（複数ユーザー、最大500件）
 * 
 * @param lineUserIds - LINE User IDs（最大500件）
 * @param messages - 送信するメッセージ（最大5件）
 * @param env - 環境変数
 */
export async function sendMulticastMessage(
  lineUserIds: string[],
  messages: LineMessage[],
  env: Bindings
): Promise<void> {
  if (lineUserIds.length === 0) {
    console.warn('[Messaging] No recipients for multicast')
    return
  }

  if (lineUserIds.length > 500) {
    throw new Error('Multicast supports up to 500 recipients')
  }

  const token = await getChannelAccessToken(env)

  const requestBody: MulticastMessageRequest = {
    to: lineUserIds,
    messages
  }

  const response = await fetch(`${LINE_MESSAGING_API_BASE}/message/multicast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Messaging] Failed to send multicast message:', response.status, errorText)
    throw new Error(`Failed to send multicast message: HTTP ${response.status}`)
  }

  console.log(`[Messaging] Multicast message sent to ${lineUserIds.length} users`)
}

/**
 * 新着オーディション告知メッセージ生成
 * 
 * @param audition - オーディション情報
 * @returns LINEメッセージ配列
 */
export function createAuditionAnnouncementMessage(audition: {
  id: string
  title: string
  deadline: string
  mainVisualUrl?: string
  liffUrl: string
}): LineMessage[] {
  const messages: LineMessage[] = []

  // Flexメッセージ（リッチなカード表示）
  const flexMessage: LineFlexMessage = {
    type: 'flex',
    altText: `【新着オーディション】${audition.title}`,
    contents: {
      type: 'bubble',
      hero: audition.mainVisualUrl ? {
        type: 'image',
        url: audition.mainVisualUrl,
        size: 'full',
        aspectRatio: '1:1',
        aspectMode: 'cover'
      } : undefined,
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🎭 新着オーディション',
            size: 'xs',
            color: '#999999',
            weight: 'bold'
          },
          {
            type: 'text',
            text: audition.title,
            size: 'lg',
            weight: 'bold',
            margin: 'md',
            wrap: true
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '締切',
                    size: 'sm',
                    color: '#999999',
                    weight: 'bold'
                  },
                  {
                    type: 'text',
                    text: audition.deadline,
                    size: 'sm',
                    color: '#666666',
                    wrap: true
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '詳細を見る',
              uri: audition.liffUrl
            }
          }
        ]
      }
    }
  }

  messages.push(flexMessage)

  return messages
}

/**
 * 週次まとめメッセージ生成
 * 
 * @param auditions - オーディション配列（最大10件）
 * @param liffBaseUrl - LIFFベースURL
 * @returns LINEメッセージ配列
 */
export function createWeeklySummaryMessage(
  auditions: Array<{ id: string; title: string; deadline: string }>,
  liffBaseUrl: string
): LineMessage[] {
  const messages: LineMessage[] = []

  if (auditions.length === 0) {
    const textMessage: LineTextMessage = {
      type: 'text',
      text: '【週刊casto】\n今週は新着オーディションがありませんでした。\n\n引き続きチェックをお願いします！'
    }
    messages.push(textMessage)
    return messages
  }

  // テキストメッセージ
  let summaryText = '【週刊casto】今週の新着オーディション\n\n'
  auditions.slice(0, 5).forEach((audition, index) => {
    summaryText += `${index + 1}. ${audition.title}\n`
    summaryText += `   締切: ${audition.deadline}\n\n`
  })
  
  if (auditions.length > 5) {
    summaryText += `他 ${auditions.length - 5} 件のオーディション\n\n`
  }
  
  summaryText += `詳細はこちら:\n${liffBaseUrl}/auditions`

  const textMessage: LineTextMessage = {
    type: 'text',
    text: summaryText
  }

  messages.push(textMessage)

  return messages
}
