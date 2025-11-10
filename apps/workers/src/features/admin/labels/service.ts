/**
 * Admin表示ラベルサービス
 * [SF][CA][REH] Admin代理公開時のラベル管理機能
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  AdminDisplayLabel, 
  AdminDisplayLabelsResponse,
  CreateAdminDisplayLabelRequest,
  UpdateAdminDisplayLabelRequest 
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * Supabase行からAdminDisplayLabelへの変換
 */
function toAdminDisplayLabel(row: any): AdminDisplayLabel {
  return {
    id: row.id,
    label: row.label,
    description: row.description || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Admin表示ラベル一覧取得
 */
export async function getAdminDisplayLabels(
  client: GenericSupabaseClient,
  options?: {
    page?: number
    perPage?: number
    isActive?: boolean
  }
): Promise<AdminDisplayLabelsResponse> {
  const page = options?.page || 1
  const perPage = options?.perPage || 50
  const offset = (page - 1) * perPage

  let query = client
    .from('admin_display_labels')
    .select('*', { count: 'exact' })

  // フィルター適用
  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  // ページネーションとソート
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch admin display labels:', error)
    throw new Error('表示ラベルの取得に失敗しました')
  }

  const labels = (data || []).map(toAdminDisplayLabel)

  return {
    labels,
    total: count || 0,
  }
}

/**
 * Admin表示ラベル単体取得
 */
export async function getAdminDisplayLabel(
  client: GenericSupabaseClient,
  id: string
): Promise<AdminDisplayLabel | null> {
  const { data, error } = await client
    .from('admin_display_labels')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 見つからない
    }
    console.error('Failed to fetch admin display label:', error)
    throw new Error('表示ラベルの取得に失敗しました')
  }

  return toAdminDisplayLabel(data)
}

/**
 * Admin表示ラベル作成
 */
export async function createAdminDisplayLabel(
  client: GenericSupabaseClient,
  data: CreateAdminDisplayLabelRequest
): Promise<AdminDisplayLabel> {
  const { data: newLabel, error } = await client
    .from('admin_display_labels')
    .insert({
      label: data.label,
      description: data.description || null,
      is_active: data.isActive !== undefined ? data.isActive : true,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create admin display label:', error)
    if (error.code === '23505') {
      throw new Error('同じラベル名が既に存在します')
    }
    throw new Error('表示ラベルの作成に失敗しました')
  }

  return toAdminDisplayLabel(newLabel)
}

/**
 * Admin表示ラベル更新
 */
export async function updateAdminDisplayLabel(
  client: GenericSupabaseClient,
  id: string,
  data: UpdateAdminDisplayLabelRequest
): Promise<AdminDisplayLabel> {
  const updateData: any = {}

  if (data.label !== undefined) updateData.label = data.label
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.isActive !== undefined) updateData.is_active = data.isActive

  const { data: updatedLabel, error } = await client
    .from('admin_display_labels')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update admin display label:', error)
    if (error.code === '23505') {
      throw new Error('同じラベル名が既に存在します')
    }
    if (error.code === 'PGRST116') {
      throw new Error('表示ラベルが見つかりません')
    }
    throw new Error('表示ラベルの更新に失敗しました')
  }

  return toAdminDisplayLabel(updatedLabel)
}

/**
 * Admin表示ラベル削除
 */
export async function deleteAdminDisplayLabel(
  client: GenericSupabaseClient,
  id: string
): Promise<void> {
  // 関連するオーディションがあるかチェック
  const { data: relatedAuditions, error: checkError } = await client
    .from('auditions')
    .select('id')
    .eq('admin_display_label_id', id)
    .limit(1)

  if (checkError) {
    console.error('Failed to check related auditions:', checkError)
    throw new Error('関連オーディションの確認に失敗しました')
  }

  if (relatedAuditions && relatedAuditions.length > 0) {
    throw new Error('このラベルを使用しているオーディションがあるため削除できません')
  }

  // 削除実行
  const { error } = await client
    .from('admin_display_labels')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete admin display label:', error)
    throw new Error('表示ラベルの削除に失敗しました')
  }
}

/**
 * 有効なAdmin表示ラベル一覧取得（選択肢用）
 */
export async function getActiveAdminDisplayLabels(
  client: GenericSupabaseClient
): Promise<AdminDisplayLabel[]> {
  const { data, error } = await client
    .from('admin_display_labels')
    .select('*')
    .eq('is_active', true)
    .order('label', { ascending: true })

  if (error) {
    console.error('Failed to fetch active admin display labels:', error)
    throw new Error('有効な表示ラベルの取得に失敗しました')
  }

  return (data || []).map(toAdminDisplayLabel)
}
