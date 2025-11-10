/**
 * Admin オーディション管理サービス
 * [SF][REH] シンプル、堅牢なエラーハンドリング
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditionListItem {
  id: string
  title: string
  status: string
  application_end_date: string
  created_at: string
  organizer_id?: string
  admin_display_label_id?: string
  organizer_profiles?: {
    name?: string
  }
  admin_display_labels?: {
    label: string
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
        application_end_date,
        created_at,
        organizer_id,
        admin_display_label_id,
        organizer_profiles!auditions_organizer_profiles_fk (
          name
        ),
        admin_display_labels!auditions_admin_display_label_id_fkey (
          label
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

        const profiles = audition.organizer_profiles as any
        const organizerProfile = Array.isArray(profiles)
          ? profiles.length > 0
            ? profiles[0]
            : undefined
          : profiles || undefined

        const labels = audition.admin_display_labels as any
        const displayLabel = Array.isArray(labels)
          ? labels.length > 0
            ? labels[0]
            : undefined
          : labels || undefined

        return {
          ...audition,
          organizer_profiles: organizerProfile
            ? {
                name: organizerProfile.name ?? undefined,
              }
            : undefined,
          admin_display_labels: displayLabel
            ? {
                label: displayLabel.label,
              }
            : undefined,
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
        *,
        organizer_profiles!auditions_organizer_profiles_fk (
          name
        ),
        admin_display_labels!auditions_admin_display_label_id_fkey (
          label
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

    const profiles = data.organizer_profiles as any
    const organizerProfile = Array.isArray(profiles)
      ? profiles.length > 0
        ? profiles[0]
        : undefined
      : profiles || undefined

    const labels = data.admin_display_labels as any
    const displayLabel = Array.isArray(labels)
      ? labels.length > 0
        ? labels[0]
        : undefined
      : labels || undefined

    return {
      ...data,
      organizer_profiles: organizerProfile
        ? {
            name: organizerProfile.name ?? undefined,
          }
        : undefined,
      admin_display_labels: displayLabel
        ? {
            label: displayLabel.label,
          }
        : undefined,
      _count: {
        audition_applications: appCount || 0,
      },
    } as AuditionListItem
  } catch (error) {
    console.error('[getAuditionDetail] Error:', error)
    return null
  }
}
