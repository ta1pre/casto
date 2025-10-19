/**
 * 一斉配信API ルート
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 * 
 * POST /api/v1/internal/messaging/*
 * 
 * 注意: 内部使用のみ（管理者認証必須）
 */

import { Hono } from 'hono'
import type { AppBindings } from '../../types'
import { createSupabaseClient } from '../../lib/supabase'
import {
  sendAuditionAnnouncement,
  sendWeeklySummary,
  getMonthlyMessageCount,
  checkFreeQuota,
  getFriendshipStats,
  getUsersWithFriendship
} from './broadcast.service'
import type { LineTextMessage } from '../../types/lineMessaging'
import { sendPushMessage } from '../../lib/line-messaging'

const router = new Hono<AppBindings>()

/**
 * 新着オーディション告知
 * 
 * @route POST /api/v1/internal/messaging/audition-announcement
 * @access Admin only
 */
router.post('/audition-announcement', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { auditionId } = await c.req.json<{ auditionId: string }>()
    
    if (!auditionId) {
      return c.json({ error: 'auditionId is required' }, 400)
    }

    const supabase = createSupabaseClient(c)
    const result = await sendAuditionAnnouncement(
      auditionId,
      supabase,
      c.env,
      user.id
    )

    if (result.error) {
      return c.json({ error: result.error }, 500)
    }

    return c.json({
      success: true,
      total: result.total,
      sent: result.success,
      failed: result.failed
    })
  } catch (error) {
    console.error('[API] Error sending audition announcement:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

/**
 * 週次まとめ配信
 * 
 * @route POST /api/v1/internal/messaging/weekly-summary
 * @access Admin only
 */
router.post('/weekly-summary', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    const result = await sendWeeklySummary(supabase, c.env, user.id)

    if (result.error) {
      return c.json({ error: result.error }, 500)
    }

    return c.json({
      success: true,
      total: result.total,
      sent: result.success,
      failed: result.failed
    })
  } catch (error) {
    console.error('[API] Error sending weekly summary:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

/**
 * 送信統計取得
 * 
 * @route GET /api/v1/internal/messaging/stats
 * @access Admin only
 */
router.get('/stats', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    const quota = await checkFreeQuota(supabase)

    return c.json({
      monthlyQuota: 500,
      sent: quota.sent,
      remaining: quota.remaining,
      exceeded: quota.exceeded,
      percentage: Math.round((quota.sent / 500) * 100)
    })
  } catch (error) {
    console.error('[API] Error getting stats:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

/**
 * 送信履歴一覧
 * 
 * @route GET /api/v1/internal/messaging/history
 * @access Admin only
 */
router.get('/history', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    
    // クエリパラメータ
    const limit = Number(c.req.query('limit')) || 20
    const offset = Number(c.req.query('offset')) || 0

    const { data: logs, error } = await supabase
      .from('messaging_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`)
    }

    return c.json({
      logs: logs || [],
      limit,
      offset
    })
  } catch (error) {
    console.error('[API] Error getting history:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

/**
 * 友だち追加状態の統計
 * 
 * @route GET /api/v1/internal/messaging/friendship-stats
 * @access Admin only
 */
router.get('/friendship-stats', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    const stats = await getFriendshipStats(supabase)

    return c.json(stats)
  } catch (error) {
    console.error('[API] Error getting friendship stats:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

/**
 * ユーザー一覧（友だち状態付き）
 * 
 * @route GET /api/v1/internal/messaging/users
 * @access Admin only
 */
router.get('/users', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const supabase = createSupabaseClient(c)
    
    // クエリパラメータ
    const status = c.req.query('status') as 'friends' | 'blocked' | 'unknown' | 'all' | undefined
    const limit = Number(c.req.query('limit')) || 20
    const offset = Number(c.req.query('offset')) || 0

    const result = await getUsersWithFriendship(supabase, {
      status,
      limit,
      offset
    })

    return c.json(result)
  } catch (error) {
    console.error('[API] Error getting users:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

/**
 * 個別メッセージ送信
 * 
 * @route POST /api/v1/internal/messaging/send-direct
 * @access Admin only
 */
router.post('/send-direct', async (c) => {
  try {
    // 管理者認証チェック
    const user = c.get('user')
    if (!user || !user.roles.includes('admin')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { lineUserId, message } = await c.req.json<{
      lineUserId: string
      message: string
    }>()

    if (!lineUserId || !message) {
      return c.json({ error: 'lineUserId and message are required' }, 400)
    }

    if (message.length > 500) {
      return c.json({ error: 'Message must be 500 characters or less' }, 400)
    }

    // LINE Messaging APIで送信
    const textMessage: LineTextMessage = {
      type: 'text',
      text: message
    }
    
    await sendPushMessage(
      lineUserId,
      [textMessage],
      c.env
    )

    // 送信ログを記録
    const supabase = createSupabaseClient(c)
    await supabase.from('messaging_logs').insert({
      message_type: 'direct_message',
      recipient_count: 1,
      success_count: 1,
      failed_count: 0,
      sent_by: user.id,
      sent_at: new Date().toISOString()
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('[API] Error sending direct message:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

export default router
