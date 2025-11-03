/**
 * オーディション種別サービス
 * [SF][CA] 種別マスタの取得・更新
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AuditionType,
  SupabaseAuditionTypeRow,
  AuditionTypesResponse,
  UpdateAuditionTypeRequest,
} from '@casto/shared'

/**
 * Supabase行データをAPIレスポンス形式に変換
 */
function toAuditionType(row: SupabaseAuditionTypeRow): AuditionType {
  return {
    id: row.id,
    typeCode: row.type_code,
    displayName: row.display_name,
    description: row.description ?? undefined,
    basePoints: row.base_points,
    freeViewCount: row.free_view_count,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * 全種別を取得
 */
export async function getAllAuditionTypes(
  supabase: SupabaseClient
): Promise<AuditionTypesResponse> {
  const { data, error } = await supabase
    .from('audition_types')
    .select('*')
    .order('type_code', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch audition types: ${error.message}`)
  }

  return {
    types: (data as SupabaseAuditionTypeRow[]).map(toAuditionType),
  }
}

/**
 * 有効な種別のみ取得
 */
export async function getActiveAuditionTypes(
  supabase: SupabaseClient
): Promise<AuditionTypesResponse> {
  const { data, error } = await supabase
    .from('audition_types')
    .select('*')
    .eq('is_active', true)
    .order('type_code', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch active audition types: ${error.message}`)
  }

  return {
    types: (data as SupabaseAuditionTypeRow[]).map(toAuditionType),
  }
}

/**
 * 種別を更新（管理者のみ）
 */
export async function updateAuditionType(
  supabase: SupabaseClient,
  typeId: string,
  updates: UpdateAuditionTypeRequest
): Promise<AuditionType> {
  const payload: Record<string, unknown> = {
    display_name: updates.displayName,
    description: updates.description,
    base_points: updates.basePoints,
    is_active: updates.isActive,
  }

  if (typeof updates.freeViewCount === 'number') {
    payload.free_view_count = updates.freeViewCount
  }

  const { data, error } = await supabase
    .from('audition_types')
    .update(payload)
    .eq('id', typeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update audition type: ${error.message}`)
  }

  return toAuditionType(data as SupabaseAuditionTypeRow)
}
