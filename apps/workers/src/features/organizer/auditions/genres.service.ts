/**
 * ジャンルマスタサービス
 * [SF][CA] ジャンル一覧取得
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuditionGenre, SupabaseAuditionGenreRow } from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
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
 * ジャンル一覧取得（アクティブのみ）
 */
export async function getActiveGenres(
  client: GenericSupabaseClient
): Promise<AuditionGenre[]> {
  const { data, error } = await client
    .from('audition_genres')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch genres: ${error.message}`)
  }

  return (data || []).map(toAuditionGenre)
}

/**
 * ジャンルIDから取得
 */
export async function getGenresByIds(
  client: GenericSupabaseClient,
  genreIds: string[]
): Promise<AuditionGenre[]> {
  if (genreIds.length === 0) {
    return []
  }

  const { data, error } = await client
    .from('audition_genres')
    .select('*')
    .in('id', genreIds)

  if (error) {
    throw new Error(`Failed to fetch genres: ${error.message}`)
  }

  return (data || []).map(toAuditionGenre)
}
