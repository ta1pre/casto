/**
 * 通知関連の型定義
 * [CA][SFT] Workers/Web共通の型定義
 */

/**
 * 通知タイプ
 */
export type NotificationType = 
  | 'application_received'      // 応募受付完了（応募者へ）
  | 'new_application'           // 新規応募（主催者へ）
  | 'application_accepted'      // 合格通知（応募者へ）
  | 'application_rejected'      // 不合格通知（応募者へ）
  | 'audition_deadline_reminder' // 締切リマインダー
  | 'audition_status_changed'   // オーディションステータス変更

/**
 * 参照レコードタイプ
 */
export type ReferenceType = 'audition' | 'application'

/**
 * notificationsテーブルの行データ（Supabaseから取得）
 */
export interface SupabaseNotificationRow {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  reference_type: ReferenceType | null
  reference_id: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

/**
 * APIレスポンス用の通知情報
 */
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  referenceType?: ReferenceType
  referenceId?: string
  readAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * 通知一覧レスポンス
 */
export interface NotificationsResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
  page?: number
  perPage?: number
}

/**
 * 通知既読更新リクエスト
 */
export interface MarkNotificationReadRequest {
  notificationId: string
}

/**
 * 通知作成リクエスト（内部使用）
 */
export interface CreateNotificationRequest {
  userId: string
  type: NotificationType
  title: string
  message: string
  referenceType?: ReferenceType
  referenceId?: string
}

/**
 * 通知フィルタオプション
 */
export interface NotificationFilterOptions {
  type?: NotificationType
  unreadOnly?: boolean
  page?: number
  perPage?: number
}
