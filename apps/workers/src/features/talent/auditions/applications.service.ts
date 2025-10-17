/**
 * タレント応募サービス（ステップ対応版）
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionApplicationRow,
  AuditionApplication,
  CreateAuditionApplicationRequest,
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
 * タレントの応募一覧取得
 */
export async function getTalentApplications(
  client: GenericSupabaseClient,
  talentId: string,
  options?: {
    status?: string
    page?: number
    perPage?: number
  }
): Promise<{ applications: AuditionApplication[]; total: number }> {
  let query = client
    .from('audition_applications')
    .select('*, auditions(title, status)', { count: 'exact' })
    .eq('talent_id', talentId)
    .order('applied_at', { ascending: false })

  if (options?.status) {
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
    if (row.auditions?.title) {
      app.auditionTitle = row.auditions.title
    }
    return app
  })

  return {
    applications,
    total: count || 0,
  }
}

/**
 * 応募詳細取得（タレント用）
 */
export async function getTalentApplicationById(
  client: GenericSupabaseClient,
  applicationId: string,
  talentId: string
): Promise<AuditionApplication | null> {
  const { data, error } = await client
    .from('audition_applications')
    .select('*, auditions(title, status), audition_steps!current_step_id(*)')
    .eq('id', applicationId)
    .eq('talent_id', talentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch application: ${error.message}`)
  }

  const application = toAuditionApplication(data)
  
  if (data.auditions?.title) {
    application.auditionTitle = data.auditions.title
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
 * 応募作成（タレント用）
 */
export async function createTalentApplication(
  client: GenericSupabaseClient,
  talentId: string,
  data: CreateAuditionApplicationRequest
): Promise<AuditionApplication> {
  // オーディションが存在し、公開中であることを確認
  const { data: auditionData, error: auditionError } = await client
    .from('auditions')
    .select('id, status, application_end_date')
    .eq('id', data.auditionId)
    .eq('status', 'published')
    .maybeSingle()

  if (auditionError) {
    throw new Error(`Failed to verify audition: ${auditionError.message}`)
  }

  if (!auditionData) {
    throw new Error('Audition not found or not published')
  }

  // 募集期間チェック
  const endDate = new Date(auditionData.application_end_date)
  if (endDate < new Date()) {
    throw new Error('Application period has ended')
  }

  // 重複応募チェック
  const { data: existing, error: checkError } = await client
    .from('audition_applications')
    .select('id')
    .eq('audition_id', data.auditionId)
    .eq('talent_id', talentId)
    .maybeSingle()

  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Failed to check existing application: ${checkError.message}`)
  }

  if (existing) {
    throw new Error('You have already applied to this audition')
  }

  // 応募作成
  const { data: newApp, error: insertError } = await client
    .from('audition_applications')
    .insert({
      audition_id: data.auditionId,
      talent_id: talentId,
      overall_status: 'pending',
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create application: ${insertError.message}`)
  }

  return toAuditionApplication(newApp)
}

/**
 * 応募取り下げ（タレント用）
 */
export async function withdrawTalentApplication(
  client: GenericSupabaseClient,
  applicationId: string,
  talentId: string
): Promise<AuditionApplication> {
  const { data: updatedApp, error } = await client
    .from('audition_applications')
    .update({ overall_status: 'withdrawn' })
    .eq('id', applicationId)
    .eq('talent_id', talentId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to withdraw application: ${error.message}`)
  }

  return toAuditionApplication(updatedApp)
}
