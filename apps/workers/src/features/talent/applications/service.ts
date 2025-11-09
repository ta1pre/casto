/**
 * 応募者向け応募サービス
 * [SF][CA][DRY] 応募送信・管理
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseApplicationRow,
  Application,
  ApplicantProfileSnapshot,
  CreateApplicationRequest,
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
    extraApplicationData: (row.extra_application_data as Record<string, unknown>) || undefined,
    status: row.status,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * talent_profilesからスナップショットを作成
 */
async function createProfileSnapshot(
  client: GenericSupabaseClient,
  userId: string
): Promise<ApplicantProfileSnapshot> {
  const { data, error } = await client
    .from('talent_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch talent profile: ${error.message}`)
  }

  if (!data) {
    throw new Error('Talent profile not found. Please create your profile first.')
  }

  // スナップショット作成
  return {
    stageName: data.stage_name,
    gender: data.gender,
    birthdate: data.birthdate || undefined,
    prefecture: data.prefecture,
    occupation: data.occupation || undefined,
    height: data.height || undefined,
    weight: data.weight || undefined,
    bust: data.bust || undefined,
    waist: data.waist || undefined,
    hip: data.hip || undefined,
    achievements: data.achievements || undefined,
    affiliationType: data.affiliation_type || undefined,
    agency: data.agency || undefined,
    twitter: data.twitter || undefined,
    instagram: data.instagram || undefined,
    tiktok: data.tiktok || undefined,
    youtube: data.youtube || undefined,
    followers: data.followers || undefined,
    photoFaceUrl: data.photo_face_url || undefined,
    photoFullBodyUrl: data.photo_full_body_url || undefined,
  }
}

/**
 * 応募作成（talent_profilesから自動取得）
 */
export async function submitApplication(
  client: GenericSupabaseClient,
  userId: string,
  data: CreateApplicationRequest
): Promise<Application> {
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
    throw new Error('Audition not found or not accepting applications')
  }

  // 締切チェック
  const endDate = new Date(auditionData.application_end_date)
  if (endDate < new Date()) {
    throw new Error('Application deadline has passed')
  }

  // プロフィールスナップショット作成
  const profileSnapshot = await createProfileSnapshot(client, userId)

  // 応募作成
  const { data: newApplication, error: applicationError } = await client
    .from('applications')
    .insert({
      audition_id: data.auditionId,
      applicant_id: userId,
      applicant_profile: profileSnapshot,
      additional_message: data.additionalMessage || null,
      additional_urls: data.additionalUrls || [],
      extra_application_data: data.extraApplicationData || {},
    })
    .select()
    .single()

  if (applicationError) {
    // 重複応募の場合
    if (applicationError.code === '23505') {
      throw new Error('You have already applied to this audition')
    }
    throw new Error(`Failed to submit application: ${applicationError.message}`)
  }

  return toApplication(newApplication)
}

/**
 * 自分の応募一覧取得
 */
export async function getMyApplications(
  client: GenericSupabaseClient,
  userId: string,
  options?: {
    status?: string
    page?: number
    perPage?: number
  }
): Promise<{ applications: Application[]; total: number }> {
  let query = client
    .from('applications')
    .select('*', { count: 'exact' })
    .eq('applicant_id', userId)
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
 * 自分の応募詳細取得
 */
export async function getMyApplicationById(
  client: GenericSupabaseClient,
  applicationId: string,
  userId: string
): Promise<Application | null> {
  const { data, error } = await client
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('applicant_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch application: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return toApplication(data)
}

/**
 * 応募辞退
 */
export async function withdrawApplication(
  client: GenericSupabaseClient,
  applicationId: string,
  userId: string
): Promise<Application> {
  // 応募が存在し、自分のものであることを確認
  const application = await getMyApplicationById(client, applicationId, userId)

  if (!application) {
    throw new Error('Application not found')
  }

  // submitted状態のみ辞退可能
  if (application.status !== 'submitted') {
    throw new Error('Only submitted applications can be withdrawn')
  }

  // 辞退処理
  const { data: updatedData, error } = await client
    .from('applications')
    .update({
      status: 'withdrawn',
    })
    .eq('id', applicationId)
    .eq('applicant_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to withdraw application: ${error.message}`)
  }

  return toApplication(updatedData)
}
