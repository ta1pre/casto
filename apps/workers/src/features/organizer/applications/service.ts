/**
 * 応募管理サービス（主催者向け）
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseApplicationRow,
  Application,
  ApplicantProfileSnapshot,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
 */
function toApplication(row: SupabaseApplicationRow): Application {
  return {
    id: row.id,
    auditionId: row.audition_id,
    applicantId: row.applicant_id,
    applicantProfile: row.applicant_profile as unknown as ApplicantProfileSnapshot,
    additionalMessage: row.additional_message || undefined,
    additionalUrls: row.additional_urls || undefined,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * オーディションへの応募一覧取得（主催者用）
 */
export async function getApplicationsByAudition(
  client: GenericSupabaseClient,
  auditionId: string,
  organizerId: string,
  options?: {
    status?: string
    page?: number
    perPage?: number
  }
): Promise<{ applications: Application[]; total: number }> {
  // まず、オーディションが主催者のものであることを確認
  const { data: auditionData, error: auditionError } = await client
    .from('auditions')
    .select('id')
    .eq('id', auditionId)
    .eq('organizer_id', organizerId)
    .maybeSingle()

  if (auditionError) {
    throw new Error(`Failed to verify audition ownership: ${auditionError.message}`)
  }

  if (!auditionData) {
    throw new Error('Audition not found or access denied')
  }

  // 応募一覧取得
  let query = client
    .from('applications')
    .select('*', { count: 'exact' })
    .eq('audition_id', auditionId)
    .order('submitted_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const page = options?.page || 1
  const perPage = options?.perPage || 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }

  return {
    applications: (data || []).map(toApplication),
    total: count || 0,
  }
}

/**
 * 応募詳細取得（主催者用）
 */
export async function getApplicationById(
  client: GenericSupabaseClient,
  applicationId: string,
  organizerId: string
): Promise<Application | null> {
  // 応募情報取得
  const { data: applicationData, error: applicationError } = await client
    .from('applications')
    .select('*, auditions!inner(organizer_id)')
    .eq('id', applicationId)
    .maybeSingle()

  if (applicationError) {
    throw new Error(`Failed to fetch application: ${applicationError.message}`)
  }

  if (!applicationData) {
    return null
  }

  // 主催者の権限チェック
  if (applicationData.auditions.organizer_id !== organizerId) {
    throw new Error('Access denied')
  }

  return toApplication(applicationData)
}

/**
 * 応募ステータス更新（主催者用）
 */
export async function updateApplicationStatus(
  client: GenericSupabaseClient,
  applicationId: string,
  organizerId: string,
  status: string
): Promise<Application> {
  // まず、主催者の権限確認
  const application = await getApplicationById(client, applicationId, organizerId)

  if (!application) {
    throw new Error('Application not found or access denied')
  }

  // ステータス更新
  const { data: updatedData, error } = await client
    .from('applications')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`)
  }

  return toApplication(updatedData)
}
