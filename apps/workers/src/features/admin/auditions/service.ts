/**
 * Admin オーディション管理サービス
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditionListItem {
  id: string
  title: string
  status: string
  deadline: string
  created_at: string
  organizers?: {
    company_name: string
  }
  _count?: {
    audition_applications: number
  }
}

/**
 * オーディション一覧取得（管理者用）
 */
export async function getAuditions(
  supabase: SupabaseClient,
  options?: {
    status?: string
    limit?: number
    offset?: number
  }
): Promise<{ auditions: AuditionListItem[]; total: number }> {
  try {
    let query = supabase
      .from('auditions')
      .select(
        `
        id,
        title,
        status,
        deadline,
        created_at,
        organizers (
          company_name
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // ステータスフィルター
    if (options?.status) {
      query = query.eq('status', options.status)
    }

    // ページネーション
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // 応募数を取得
    const auditionsWithCount = await Promise.all(
      (data || []).map(async (audition) => {
        const { count: appCount } = await supabase
          .from('audition_applications')
          .select('id', { count: 'exact', head: true })
          .eq('audition_id', audition.id)

        const organizers = audition.organizers as any
        return {
          ...audition,
          organizers: Array.isArray(organizers) ? organizers[0] : organizers,
          _count: {
            audition_applications: appCount || 0,
          },
        }
      })
    )

    return {
      auditions: auditionsWithCount as AuditionListItem[],
      total: count || 0,
    }
  } catch (error) {
    console.error('[getAuditions] Error:', error)
    // 詳細なエラー情報を含める
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to fetch auditions: ${errorMessage}`)
  }
}

/**
 * オーディション詳細取得（管理者用）
 */
export async function getAuditionDetail(
  supabase: SupabaseClient,
  auditionId: string
): Promise<AuditionListItem | null> {
  try {
    const { data, error } = await supabase
      .from('auditions')
      .select(
        `
        id,
        title,
        status,
        deadline,
        created_at,
        organizers (
          company_name
        )
      `
      )
      .eq('id', auditionId)
      .single()

    if (error) {
      throw error
    }

    // 応募数を取得
    const { count: appCount } = await supabase
      .from('audition_applications')
      .select('id', { count: 'exact', head: true })
      .eq('audition_id', auditionId)

    const organizers = data.organizers as any
    return {
      ...data,
      organizers: Array.isArray(organizers) ? organizers[0] : organizers,
      _count: {
        audition_applications: appCount || 0,
      },
    } as AuditionListItem
  } catch (error) {
    console.error('[getAuditionDetail] Error:', error)
    return null
  }
}
