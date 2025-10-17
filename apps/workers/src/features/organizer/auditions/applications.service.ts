/**
 * オーディション応募サービス（主催者側）
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionApplicationRow,
  AuditionApplication,
  UpdateAuditionApplicationRequest,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
 */
function toAuditionApplication(row: SupabaseAuditionApplicationRow): AuditionApplication {
  return {
    id: row.id,
    auditionId: row.audition_id,
    talentId: row.talent_id,
    currentStepId: row.current_step_id || undefined,
    overallStatus: row.overall_status,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * オーディションの応募一覧取得（主催者用）
 */
export async function getAuditionApplications(
  client: GenericSupabaseClient,
  auditionId: string,
  options?: {
    status?: string
    page?: number
    perPage?: number
  }
): Promise<{ applications: AuditionApplication[]; total: number }> {
  let query = client
    .from('audition_applications')
    .select('*, users!talent_id(id, talent_profiles(stage_name, completion_rate))', { count: 'exact' })
    .eq('audition_id', auditionId)
    .order('applied_at', { ascending: false })

  // フィルタロジック: "all"の場合はunreadを除外、それ以外は指定ステータスのみ
  if (options?.status === 'all') {
    query = query.neq('overall_status', 'unread')
  } else if (options?.status) {
    query = query.eq('overall_status', options.status)
  }

  const page = options?.page || 1
  const perPage = options?.perPage || 50
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }

  const applications = (data || []).map((row: any) => {
    const app = toAuditionApplication(row)
    if (row.users?.talent_profiles?.stage_name) {
      app.talentName = row.users.talent_profiles.stage_name
    }
    if (row.users?.talent_profiles?.completion_rate !== undefined) {
      app.profileCompletionRate = row.users.talent_profiles.completion_rate
    }
    return app
  })

  return {
    applications,
    total: count || 0,
  }
}

/**
 * 応募詳細取得（主催者用）
 */
export async function getApplicationById(
  client: GenericSupabaseClient,
  applicationId: string,
  auditionId: string
): Promise<AuditionApplication | null> {
  const { data, error } = await client
    .from('audition_applications')
    .select('*, users!talent_id(id, talent_profiles(stage_name)), audition_steps!current_step_id(*)')
    .eq('id', applicationId)
    .eq('audition_id', auditionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch application: ${error.message}`)
  }

  const application = toAuditionApplication(data)
  
  if (data.users?.talent_profiles?.stage_name) {
    application.talentName = data.users.talent_profiles.stage_name
  }

  if (data.audition_steps) {
    application.currentStep = {
      id: data.audition_steps.id,
      auditionId: data.audition_steps.audition_id,
      stepOrder: data.audition_steps.step_order,
      stepType: data.audition_steps.step_type,
      title: data.audition_steps.title,
      description: data.audition_steps.description || undefined,
      createdAt: data.audition_steps.created_at,
      updatedAt: data.audition_steps.updated_at,
    }
  }

  return application
}

/**
 * 応募ステータス更新（主催者用）
 */
export async function updateApplicationStatus(
  client: GenericSupabaseClient,
  applicationId: string,
  auditionId: string,
  data: UpdateAuditionApplicationRequest
): Promise<AuditionApplication> {
  const updateData: any = {}

  if (data.currentStepId !== undefined) {
    updateData.current_step_id = data.currentStepId
  }
  if (data.overallStatus !== undefined) {
    updateData.overall_status = data.overallStatus
  }

  const { data: updatedApp, error } = await client
    .from('audition_applications')
    .update(updateData)
    .eq('id', applicationId)
    .eq('audition_id', auditionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update application: ${error.message}`)
  }

  return toAuditionApplication(updatedApp)
}
