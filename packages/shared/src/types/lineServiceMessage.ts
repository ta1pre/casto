/**
 * LINEサービスメッセージ関連の型定義
 * [CA][SFT] LINE Developers API準拠
 */

/**
 * サービス通知トークン発行リクエスト
 */
export interface IssueServiceNotificationTokenRequest {
  liffAccessToken: string
}

/**
 * サービス通知トークン発行レスポンス
 */
export interface IssueServiceNotificationTokenResponse {
  notificationToken: string
  remainingCount: number
}

/**
 * サービスメッセージ送信リクエスト
 */
export interface SendServiceMessageRequest {
  templateName: string
  notificationToken: string
  params?: Record<string, string>
}

/**
 * サービスメッセージ送信レスポンス
 */
export interface SendServiceMessageResponse {
  status: 'success' | 'failed'
  notificationToken?: string  // 後続メッセージ用の新トークン
  remainingCount?: number
}

/**
 * LINE API エラーレスポンス
 */
export interface LineApiError {
  message: string
  details?: Array<{
    message: string
    property: string
  }>
}
