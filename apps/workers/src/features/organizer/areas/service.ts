/**
 * 主催者向けエリアサービス
 * [SF][CA] エリアマスタ取得
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseAuditionAreaRow,
  AuditionArea,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
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
 * 全エリア取得（全国 + 47都道府県）
 */
export async function getAllAreas(
  client: GenericSupabaseClient
): Promise<AuditionArea[]> {
  const { data, error } = await client
    .from('audition_areas')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch areas: ${error.message}`)
  }

  return (data || []).map(toAuditionArea)
}
