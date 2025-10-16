/**
 * 応募者向けオーディションサービス
 * [SF][CA][DRY] 公開オーディション取得
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionRow,
  Audition,
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
 * 公開中のオーディション一覧取得
 */
export async function getPublishedAuditions(
  client: GenericSupabaseClient,
  options?: {
    projectType?: string
    genreIds?: string[]
    search?: string
    page?: number
    perPage?: number
  }
): Promise<{ auditions: Audition[]; total: number }> {
  let query = client
    .from('auditions')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (options?.projectType) {
    query = query.eq('project_type', options.projectType)
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
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

  let auditions = (data || []).map(toAudition)

  // ジャンルフィルタリング（指定がある場合）
  if (options?.genreIds && options.genreIds.length > 0) {
    const auditionIds = auditions.map((a) => a.id)

    const { data: genreMapData, error: genreMapError } = await client
      .from('audition_genre_map')
      .select('audition_id')
      .in('audition_id', auditionIds)
      .in('genre_id', options.genreIds)

    if (genreMapError) {
      console.error('Failed to filter by genres:', genreMapError)
    } else {
      const matchingAuditionIds = new Set(
        genreMapData.map((row: any) => row.audition_id)
      )
      auditions = auditions.filter((a) => matchingAuditionIds.has(a.id))
    }
  }

  return {
    auditions,
    total: count || 0,
  }
}

/**
 * 公開オーディション詳細取得（ジャンル含む）
 */
export async function getPublishedAuditionById(
  client: GenericSupabaseClient,
  auditionId: string
): Promise<Audition | null> {
  const { data: auditionData, error: auditionError } = await client
    .from('auditions')
    .select('*')
    .eq('id', auditionId)
    .eq('status', 'published')
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

  // エリア情報を取得
  const { data: areaData, error: areaError } = await client
    .from('audition_area_map')
    .select('area_id, audition_areas(*)')
    .eq('audition_id', auditionId)

  if (!areaError && areaData) {
    audition.areas = areaData
      .filter((row: any) => row.audition_areas)
      .map((row: any) => toAuditionArea(row.audition_areas))
  }

  return audition
}
