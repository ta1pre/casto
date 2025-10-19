/**
 * 一斉配信サービス
 * [SF][PA][REH] シンプル、パフォーマンス、堅牢
 * 
 * 新着オーディション告知、週次まとめ、カスタム配信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Bindings } from '../../types/bindings'
import {
  sendMulticastMessage,
  createAuditionAnnouncementMessage,
  createWeeklySummaryMessage
} from '../../lib/line-messaging'

/**
 * 配信結果
 */
export interface BroadcastResult {
  total: number
  success: number
  failed: number
  error?: string
}

/**
 * 新着オーディション告知
 * 
 * 友だち追加済みユーザー全員に新着オーディションを告知します。
 * 
 * @param auditionId - オーディションID
 * @param supabase - Supabaseクライアント
 * @param env - 環境変数
 * @param sentBy - 送信者ユーザーID（管理者）
 * @returns 配信結果
 */
export async function sendAuditionAnnouncement(
  auditionId: string,
  supabase: SupabaseClient,
  env: Bindings,
  sentBy?: string
): Promise<BroadcastResult> {
  try {
    // 1. オーディション情報取得
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select('id, title, application_end_date, main_visual_url')
      .eq('id', auditionId)
      .single()

    if (auditionError || !audition) {
      throw new Error(`Audition not found: ${auditionId}`)
    }

    // 2. 友だち追加済みユーザーのLINE User ID取得
    const lineUserIds = await getActiveLineUsers(supabase)

    if (lineUserIds.length === 0) {
      console.warn('[Broadcast] No active LINE users found')
      return { total: 0, success: 0, failed: 0 }
    }

    // 3. メッセージ生成
    const frontendUrl = env.WEB_URL || 'https://casto.sb2024.xyz'
    const liffUrl = `${frontendUrl}/liff/auditions/${audition.id}`
    const messages = createAuditionAnnouncementMessage({
      id: audition.id,
      title: audition.title,
      deadline: new Date(audition.application_end_date).toLocaleDateString('ja-JP'),
      mainVisualUrl: audition.main_visual_url || undefined,
      liffUrl
    })

    // 4. 500件ずつバッチ送信
    const result = await sendInBatches(lineUserIds, messages, env)

    // 5. 送信履歴をDBに記録
    await logBroadcast(
      'audition_announcement',
      lineUserIds.length,
      result.success,
      result.failed,
      { auditionId, auditionTitle: audition.title },
      sentBy,
      supabase
    )

    return {
      total: lineUserIds.length,
      success: result.success,
      failed: result.failed
    }
  } catch (error) {
    console.error('[Broadcast] Error sending audition announcement:', error)
    return {
      total: 0,
      success: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 週次まとめ配信
 * 
 * 過去7日間の新着オーディションをまとめて配信します。
 * 
 * @param supabase - Supabaseクライアント
 * @param env - 環境変数
 * @param sentBy - 送信者ユーザーID（管理者）
 * @returns 配信結果
 */
export async function sendWeeklySummary(
  supabase: SupabaseClient,
  env: Bindings,
  sentBy?: string
): Promise<BroadcastResult> {
  try {
    // 1. 過去7日間の公開オーディション取得
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: auditions, error: auditionsError } = await supabase
      .from('auditions')
      .select('id, title, application_end_date')
      .eq('status', 'published')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (auditionsError) {
      throw new Error(`Failed to fetch auditions: ${auditionsError.message}`)
    }

    // 2. 友だち追加済みユーザーのLINE User ID取得
    const lineUserIds = await getActiveLineUsers(supabase)

    if (lineUserIds.length === 0) {
      console.warn('[Broadcast] No active LINE users found')
      return { total: 0, success: 0, failed: 0 }
    }

    // 3. メッセージ生成
    const liffBaseUrl = env.WEB_URL || 'https://casto.sb2024.xyz'
    const formattedAuditions = (auditions || []).map(a => ({
      id: a.id,
      title: a.title,
      deadline: new Date(a.application_end_date).toLocaleDateString('ja-JP')
    }))
    const messages = createWeeklySummaryMessage(formattedAuditions, liffBaseUrl)

    // 4. 500件ずつバッチ送信
    const result = await sendInBatches(lineUserIds, messages, env)

    // 5. 送信履歴をDBに記録
    await logBroadcast(
      'weekly_summary',
      lineUserIds.length,
      result.success,
      result.failed,
      { auditionCount: auditions?.length || 0 },
      sentBy,
      supabase
    )

    return {
      total: lineUserIds.length,
      success: result.success,
      failed: result.failed
    }
  } catch (error) {
    console.error('[Broadcast] Error sending weekly summary:', error)
    return {
      total: 0,
      success: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 友だち追加済みユーザーのLINE User ID取得
 * 
 * @param supabase - Supabaseクライアント
 * @returns LINE User ID配列
 */
async function getActiveLineUsers(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('users')
    .select('line_user_id')
    .eq('line_friendship_status', true)
    .not('line_user_id', 'is', null)

  if (error) {
    console.error('[Broadcast] Failed to fetch active LINE users:', error)
    return []
  }

  return data?.map(u => u.line_user_id).filter((id): id is string => !!id) ?? []
}

/**
 * バッチ送信（500件ずつ分割）
 * 
 * @param lineUserIds - LINE User ID配列
 * @param messages - 送信メッセージ
 * @param env - 環境変数
 * @returns 送信結果
 */
async function sendInBatches(
  lineUserIds: string[],
  messages: any[],
  env: Bindings
): Promise<{ success: number; failed: number }> {
  const BATCH_SIZE = 500
  let success = 0
  let failed = 0

  for (let i = 0; i < lineUserIds.length; i += BATCH_SIZE) {
    const batch = lineUserIds.slice(i, i + BATCH_SIZE)
    try {
      await sendMulticastMessage(batch, messages, env)
      success += batch.length
      console.log(`[Broadcast] Batch ${Math.floor(i / BATCH_SIZE) + 1} sent successfully (${batch.length} users)`)
    } catch (error) {
      failed += batch.length
      console.error(`[Broadcast] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error)
    }
  }

  return { success, failed }
}

/**
 * 送信履歴をDBに記録
 * 
 * @param messageType - メッセージタイプ
 * @param recipientCount - 配信対象数
 * @param successCount - 成功数
 * @param failedCount - 失敗数
 * @param messageContent - メッセージ内容
 * @param sentBy - 送信者ユーザーID
 * @param supabase - Supabaseクライアント
 */
async function logBroadcast(
  messageType: string,
  recipientCount: number,
  successCount: number,
  failedCount: number,
  messageContent: Record<string, any>,
  sentBy: string | undefined,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('messaging_logs')
    .insert({
      message_type: messageType,
      recipient_count: recipientCount,
      success_count: successCount,
      failed_count: failedCount,
      message_content: messageContent,
      sent_by: sentBy
    })

  if (error) {
    console.error('[Broadcast] Failed to log broadcast:', error)
  }
}

/**
 * 月間送信数取得
 * 
 * @param supabase - Supabaseクライアント
 * @returns 今月の送信数
 */
export async function getMonthlyMessageCount(
  supabase: SupabaseClient
): Promise<number> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from('messaging_logs')
    .select('success_count')
    .gte('sent_at', firstDayOfMonth.toISOString())

  if (error) {
    console.error('[Broadcast] Failed to get monthly message count:', error)
    return 0
  }

  return data?.reduce((sum, log) => sum + log.success_count, 0) ?? 0
}

/**
 * 無料枠チェック
 * 
 * @param supabase - Supabaseクライアント
 * @returns 残り送信可能数と超過フラグ
 */
export async function checkFreeQuota(
  supabase: SupabaseClient
): Promise<{ remaining: number; exceeded: boolean; sent: number }> {
  const FREE_QUOTA = 500
  const sent = await getMonthlyMessageCount(supabase)
  const remaining = Math.max(0, FREE_QUOTA - sent)
  
  return {
    sent,
    remaining,
    exceeded: sent >= FREE_QUOTA
  }
}

/**
 * 友だち追加状態の統計
 * 
 * @param supabase - Supabaseクライアント
 * @returns 友だち追加/ブロック数の統計
 */
export async function getFriendshipStats(
  supabase: SupabaseClient
): Promise<{
  total: number
  friends: number
  blocked: number
  unknown: number
}> {
  try {
    // 全ユーザー数
    const { count: totalCount, error: totalError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('line_user_id', 'is', null)

    // 友だち追加済み
    const { count: friendsCount, error: friendsError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('line_friendship_status', true)

    // ブロック済み
    const { count: blockedCount, error: blockedError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('line_friendship_status', false)

    if (totalError || friendsError || blockedError) {
      console.error('[Broadcast] Failed to get friendship stats:', {
        totalError,
        friendsError,
        blockedError
      })
    }

    const total = totalCount || 0
    const friends = friendsCount || 0
    const blocked = blockedCount || 0
    const unknown = total - friends - blocked

    return { total, friends, blocked, unknown }
  } catch (error) {
    console.error('[Broadcast] Error getting friendship stats:', error)
    return { total: 0, friends: 0, blocked: 0, unknown: 0 }
  }
}

/**
 * ユーザー一覧（友だち状態付き）
 * 
 * @param supabase - Supabaseクライアント
 * @param options - フィルタリングオプション
 * @returns ユーザー一覧
 */
export async function getUsersWithFriendship(
  supabase: SupabaseClient,
  options: {
    status?: 'friends' | 'blocked' | 'unknown' | 'all'
    limit?: number
    offset?: number
  } = {}
): Promise<{
  users: Array<{
    id: string
    email: string | null
    line_user_id: string | null
    line_friendship_status: boolean | null
    line_friendship_updated_at: string | null
    created_at: string
  }>
  total: number
}> {
  try {
    const { status = 'all', limit = 20, offset = 0 } = options

    let query = supabase
      .from('users')
      .select('id, email, line_user_id, line_friendship_status, line_friendship_updated_at, created_at', { count: 'exact' })
      .not('line_user_id', 'is', null)
      .order('created_at', { ascending: false })

    // ステータスフィルタ
    if (status === 'friends') {
      query = query.eq('line_friendship_status', true)
    } else if (status === 'blocked') {
      query = query.eq('line_friendship_status', false)
    } else if (status === 'unknown') {
      query = query.is('line_friendship_status', null)
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return {
      users: data || [],
      total: count || 0
    }
  } catch (error) {
    console.error('[Broadcast] Error getting users with friendship:', error)
    return { users: [], total: 0 }
  }
}
