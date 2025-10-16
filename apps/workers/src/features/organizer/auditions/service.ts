/**
 * オーディションサービス
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionRow,
  Audition,
  CreateAuditionRequest,
  UpdateAuditionRequest,
  AuditionGenre,
  SupabaseAuditionGenreRow,
  AuditionArea,
  SupabaseAuditionAreaRow,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
 */
function toAudition(row: SupabaseAuditionRow): Audition {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    title: row.title,
    description: row.description || undefined,
    requirements: row.requirements || undefined,
    shortDescription: row.short_description || undefined,
    coverImageUrl: row.cover_image_url || undefined,
    coverImageAlt: row.cover_image_alt || undefined,
    mainVisualUrl: row.main_visual_url || undefined,
    mainVisualType: row.main_visual_type || undefined,
    applicationStartDate: row.application_start_date,
    applicationEndDate: row.application_end_date,
    maxApplicants: row.max_applicants || undefined,
    status: row.status,
    projectType: row.project_type,
    evaluationMode: row.evaluation_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * ジャンル変換
 */
function toAuditionGenre(row: SupabaseAuditionGenreRow): AuditionGenre {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    category: row.category || undefined,
    description: row.description || undefined,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }
}

/**
 * エリア変換
 */
function toAuditionArea(row: SupabaseAuditionAreaRow): AuditionArea {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    sortOrder: row.sort_order,
  }
}

/**
 * 主催者のオーディション一覧取得
 */
export async function getOrganizerAuditions(
  client: GenericSupabaseClient,
  organizerId: string,
  options?: {
    status?: string
    projectType?: string
    page?: number
    perPage?: number
  }
): Promise<{ auditions: Audition[]; total: number }> {
  let query = client
    .from('auditions')
    .select('*', { count: 'exact' })
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.projectType) {
    query = query.eq('project_type', options.projectType)
  }

  const page = options?.page || 1
  const perPage = options?.perPage || 20
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch auditions: ${error.message}`)
  }

  return {
    auditions: (data || []).map(toAudition),
    total: count || 0,
  }
}

/**
 * オーディション詳細取得（ジャンル含む）
 */
export async function getAuditionById(
  client: GenericSupabaseClient,
  auditionId: string,
  organizerId: string
): Promise<Audition | null> {
  const { data: auditionData, error: auditionError } = await client
    .from('auditions')
    .select('*')
    .eq('id', auditionId)
    .eq('organizer_id', organizerId)
    .maybeSingle()

  if (auditionError) {
    throw new Error(`Failed to fetch audition: ${auditionError.message}`)
  }

  if (!auditionData) {
    return null
  }

  const audition = toAudition(auditionData)

  // ジャンル情報を取得
  const { data: genreData, error: genreError } = await client
    .from('audition_genre_map')
    .select('genre_id, audition_genres(*)')
    .eq('audition_id', auditionId)

  if (!genreError && genreData) {
    audition.genres = genreData
      .filter((row: any) => row.audition_genres)
      .map((row: any) => toAuditionGenre(row.audition_genres))
  }

  // エリア情報を取得（単一）
  const { data: areaData, error: areaError } = await client
    .from('audition_area_map')
    .select('area_id, audition_areas(*)')
    .eq('audition_id', auditionId)
    .limit(1)
    .maybeSingle()

  if (!areaError && areaData && areaData.audition_areas) {
    audition.area = toAuditionArea(areaData.audition_areas as any)
  }

  return audition
}

/**
 * オーディション作成
 */
export async function createAudition(
  client: GenericSupabaseClient,
  organizerId: string,
  data: CreateAuditionRequest
): Promise<Audition> {
  const { genreIds, areaId, ...auditionData } = data

  // オーディション作成
  const { data: newAudition, error: auditionError } = await client
    .from('auditions')
    .insert({
      organizer_id: organizerId,
      title: auditionData.title,
      description: auditionData.description || null,
      requirements: auditionData.requirements || null,
      short_description: auditionData.shortDescription || null,
      cover_image_url: auditionData.coverImageUrl || null,
      cover_image_alt: auditionData.coverImageAlt || null,
      application_start_date: auditionData.applicationStartDate,
      application_end_date: auditionData.applicationEndDate,
      max_applicants: auditionData.maxApplicants || null,
      project_type: auditionData.projectType,
    })
    .select()
    .single()

  if (auditionError) {
    throw new Error(`Failed to create audition: ${auditionError.message}`)
  }

  // ジャンル紐付け
  if (genreIds && genreIds.length > 0) {
    const genreMapData = genreIds.map((genreId) => ({
      audition_id: newAudition.id,
      genre_id: genreId,
    }))

    const { error: genreMapError } = await client
      .from('audition_genre_map')
      .insert(genreMapData)

    if (genreMapError) {
      console.error('Failed to create genre mappings:', genreMapError)
    }
  }

  // エリア紐付け（単一）
  if (areaId) {
    const { error: areaMapError } = await client
      .from('audition_area_map')
      .insert({
        audition_id: newAudition.id,
        area_id: areaId,
      })

    if (areaMapError) {
      console.error('Failed to create area mapping:', areaMapError)
    }
  }

  return toAudition(newAudition)
}

/**
 * オーディション更新
 */
export async function updateAudition(
  client: GenericSupabaseClient,
  auditionId: string,
  organizerId: string,
  data: UpdateAuditionRequest
): Promise<Audition> {
  const { genreIds, areaId, ...auditionData } = data

  // 更新用データオブジェクト作成
  const updateData: any = {}

  if (auditionData.title !== undefined) updateData.title = auditionData.title
  if (auditionData.description !== undefined) updateData.description = auditionData.description || null
  if (auditionData.requirements !== undefined) updateData.requirements = auditionData.requirements || null
  if (auditionData.shortDescription !== undefined)
    updateData.short_description = auditionData.shortDescription || null
  if (auditionData.coverImageUrl !== undefined)
    updateData.cover_image_url = auditionData.coverImageUrl || null
  if (auditionData.coverImageAlt !== undefined)
    updateData.cover_image_alt = auditionData.coverImageAlt || null
  if (auditionData.applicationStartDate !== undefined)
    updateData.application_start_date = auditionData.applicationStartDate
  if (auditionData.applicationEndDate !== undefined)
    updateData.application_end_date = auditionData.applicationEndDate
  if (auditionData.maxApplicants !== undefined)
    updateData.max_applicants = auditionData.maxApplicants
  if (auditionData.status !== undefined) updateData.status = auditionData.status

  // オーディション更新
  const { data: updatedAudition, error: auditionError } = await client
    .from('auditions')
    .update(updateData)
    .eq('id', auditionId)
    .eq('organizer_id', organizerId)
    .select()
    .single()

  if (auditionError) {
    throw new Error(`Failed to update audition: ${auditionError.message}`)
  }

  // ジャンル更新
  if (genreIds !== undefined) {
    // 既存のジャンル紐付けを削除
    await client.from('audition_genre_map').delete().eq('audition_id', auditionId)

    // 新しいジャンル紐付けを作成
    if (genreIds.length > 0) {
      const genreMapData = genreIds.map((genreId) => ({
        audition_id: auditionId,
        genre_id: genreId,
      }))

      const { error: genreMapError } = await client
        .from('audition_genre_map')
        .insert(genreMapData)

      if (genreMapError) {
        console.error('Failed to update genre mappings:', genreMapError)
      }
    }
  }

  // エリア更新（単一）
  if (areaId !== undefined) {
    // 既存のエリア紐付けを削除
    const { error: deleteError } = await client
      .from('audition_area_map')
      .delete()
      .eq('audition_id', auditionId)

    if (deleteError) {
      console.error('Failed to delete area mapping:', deleteError)
      throw new Error(`Failed to delete area mapping: ${deleteError.message}`)
    }

    // 新しいエリア紐付けを作成
    if (areaId) {
      const { error: areaMapError } = await client
        .from('audition_area_map')
        .insert({
          audition_id: auditionId,
          area_id: areaId,
        })

      if (areaMapError) {
        console.error('Failed to update area mapping:', areaMapError)
        throw new Error(`Failed to update area mapping: ${areaMapError.message}`)
      }
    }
  }

  return toAudition(updatedAudition)
}

/**
 * オーディション削除
 */
export async function deleteAudition(
  client: GenericSupabaseClient,
  auditionId: string,
  organizerId: string
): Promise<void> {
  const { error } = await client
    .from('auditions')
    .delete()
    .eq('id', auditionId)
    .eq('organizer_id', organizerId)

  if (error) {
    throw new Error(`Failed to delete audition: ${error.message}`)
  }
}
