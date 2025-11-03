/**
 * Admin向けポイント管理サービス
 * 
 * 設計原則: [SF][REH]
 * - Admin専用の管理機能
 * - 手動付与/減算
 * - プラン管理
 * - ジャンル別単価管理
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PointsAccount, PointsPlan } from '@casto/shared'
import { grantPoints as baseGrantPoints } from '../../points/service'
import type { GrantPointsParams } from '../../points/types'

/**
 * 全アカウント取得
 */
export async function getAllAccounts(
  supabase: SupabaseClient,
  limit: number = 50,
  offset: number = 0
): Promise<{ accounts: PointsAccount[]; total: number }> {
  const { data: accounts, error, count } = await supabase
    .from('points_accounts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`)
  }

  return {
    accounts: accounts as PointsAccount[],
    total: count || 0,
  }
}

/**
 * アカウント詳細取得
 */
export async function getAccountDetail(
  supabase: SupabaseClient,
  accountId: string
): Promise<PointsAccount | null> {
  const { data, error } = await supabase
    .from('points_accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error) {
    return null
  }

  return data as PointsAccount
}

/**
 * ポイント手動付与
 */
export async function grantPointsAdmin(
  supabase: SupabaseClient,
  params: Omit<GrantPointsParams, 'transactionType'> & {
    transactionType?: 'admin_grant' | 'admin_deduct'
  }
): Promise<void> {
  await baseGrantPoints(supabase, {
    ...params,
    transactionType: params.transactionType || 'admin_grant',
  })
}

/**
 * ポイントプラン一覧取得（全て、非アクティブ含む）
 */
export async function getAllPlans(supabase: SupabaseClient): Promise<PointsPlan[]> {
  const { data, error } = await supabase
    .from('points_plans')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch plans: ${error.message}`)
  }

  return data as PointsPlan[]
}

/**
 * ポイントプラン作成
 */
export async function createPlan(
  supabase: SupabaseClient,
  plan: {
    name: string
    points: number
    price_jpy: number
    stripe_product_id?: string
    stripe_price_id?: string
    bonus_points?: number
    display_order?: number
  }
): Promise<PointsPlan> {
  const { data, error } = await supabase
    .from('points_plans')
    .insert({
      ...plan,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create plan: ${error.message}`)
  }

  return data as PointsPlan
}

/**
 * ポイントプラン更新
 */
export async function updatePlan(
  supabase: SupabaseClient,
  planId: string,
  updates: Partial<Omit<PointsPlan, 'id' | 'created_at' | 'updated_at'>>
): Promise<PointsPlan> {
  const { data, error } = await supabase
    .from('points_plans')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update plan: ${error.message}`)
  }

  return data as PointsPlan
}

/**
 * ポイントプラン削除
 */
export async function deletePlan(
  supabase: SupabaseClient,
  planId: string
): Promise<void> {
  const { error } = await supabase
    .from('points_plans')
    .delete()
    .eq('id', planId)

  if (error) {
    throw new Error(`Failed to delete plan: ${error.message}`)
  }
}

/**
 * システム設定更新
 */
export async function updateSettings(
  supabase: SupabaseClient,
  settings: {
    default_viewing_point_cost?: number
  }
): Promise<void> {
  if (settings.default_viewing_point_cost !== undefined) {
    const { error } = await supabase
      .from('system_settings')
      .update({ value: settings.default_viewing_point_cost.toString() })
      .eq('key', 'default_viewing_point_cost')

    if (error) {
      throw new Error(`Failed to update settings: ${error.message}`)
    }
  }
}

/**
 * ジャンル別単価一覧取得
 */
export async function getGenreCosts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('audition_genres')
    .select('id, slug, display_name, viewing_point_cost')
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch genre costs: ${error.message}`)
  }

  return data
}

/**
 * ジャンル別単価更新
 */
export async function updateGenreCost(
  supabase: SupabaseClient,
  genreId: string,
  viewingPointCost: number | null
): Promise<void> {
  const { error } = await supabase
    .from('audition_genres')
    .update({
      viewing_point_cost: viewingPointCost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', genreId)

  if (error) {
    throw new Error(`Failed to update genre cost: ${error.message}`)
  }
}
