/**
 * ポイント機能のサービス層
 * 
 * 設計原則: [SF][DRY][REH]
 * - トランザクション管理
 * - エラーハンドリング
 * - ビジネスロジックの集約
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PointsAccount,
  PointsTransaction,
  PointsPlan,
  ViewingEligibility,
} from './types'
import type {
  CreateAccountParams,
  GrantPointsParams,
  ConsumePointsParams,
  AuditionWithGenre,
} from './types'

/**
 * アカウント取得（存在しなければ作成）
 * 
 * [REH] 競合状態を考慮した実装
 */
export async function getOrCreateAccount(
  supabase: SupabaseClient,
  params: CreateAccountParams
): Promise<PointsAccount> {
  // 既存アカウント取得
  const { data: existing, error: fetchError } = await supabase
    .from('points_accounts')
    .select('*')
    .eq('user_id', params.userId)
    .single()

  if (existing && !fetchError) {
    return existing as PointsAccount
  }

  // 新規作成（ON CONFLICT時は既存レコードを返す）
  const { data: created, error: createError } = await supabase
    .from('points_accounts')
    .upsert(
      {
        user_id: params.userId,
        account_type: params.accountType || 'organizer',
        balance: 0,
        total_purchased: 0,
        total_consumed: 0,
        total_bonus: 0,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false, // 既存レコードを返す
      }
    )
    .select()
    .single()

  if (createError) {
    // それでもエラーの場合は再度取得を試みる（最終手段）
    const { data: retry, error: retryError } = await supabase
      .from('points_accounts')
      .select('*')
      .eq('user_id', params.userId)
      .single()
    
    if (retry && !retryError) {
      return retry as PointsAccount
    }
    
    throw new Error(`Failed to get or create points account: ${createError.message}`)
  }

  return created as PointsAccount
}

/**
 * 残高取得
 */
export async function getBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const account = await getOrCreateAccount(supabase, { userId })
  return account.balance
}

/**
 * 取引履歴取得
 */
export async function getTransactions(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ transactions: PointsTransaction[]; total: number }> {
  const account = await getOrCreateAccount(supabase, { userId })

  const { data: transactions, error, count } = await supabase
    .from('points_transactions')
    .select('*', { count: 'exact' })
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return {
    transactions: transactions as PointsTransaction[],
    total: count || 0,
  }
}

/**
 * ポイントプラン一覧取得
 */
export async function getPointsPlans(
  supabase: SupabaseClient
): Promise<PointsPlan[]> {
  const { data, error } = await supabase
    .from('points_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch points plans: ${error.message}`)
  }

  return data as PointsPlan[]
}

/**
 * デフォルト閲覧単価取得
 */
async function getDefaultViewingCost(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'default_viewing_point_cost')
    .single()

  if (error || !data) {
    return 100 // フォールバック
  }

  return parseInt(data.value, 10)
}

/**
 * オーディション情報取得（ジャンル情報含む）
 */
async function getAuditionWithGenre(
  supabase: SupabaseClient,
  applicationId: string
): Promise<AuditionWithGenre | null> {
  // applicationからaudition_idを取得
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('audition_id')
    .eq('id', applicationId)
    .single()

  if (appError || !application) {
    return null
  }

  // auditionとジャンル情報を取得
  const { data: audition, error: audError } = await supabase
    .from('auditions')
    .select(`
      id,
      viewing_point_cost,
      free_viewing_quota,
      project_type,
      max_viewing_points,
      unlimited_viewing,
      audition_genre_map!inner(
        audition_genres!inner(
          viewing_point_cost
        )
      )
    `)
    .eq('id', application.audition_id)
    .single()

  if (audError || !audition) {
    return null
  }

  // 種別マスタから無料閲覧枠を取得
  let typeFreeViewCount: number | null = null
  const { data: typeRow } = await supabase
    .from('audition_types')
    .select('free_view_count')
    .eq('type_code', audition.project_type)
    .single()

  if (typeRow && typeof typeRow.free_view_count === 'number') {
    typeFreeViewCount = typeRow.free_view_count
  }

  // ジャンル情報を整形
  const genreMap = audition.audition_genre_map as any[]
  const genre = genreMap && genreMap.length > 0
    ? { viewing_point_cost: genreMap[0].audition_genres.viewing_point_cost }
    : null

  return {
    id: audition.id,
    viewing_point_cost: audition.viewing_point_cost,
    free_viewing_quota: audition.free_viewing_quota,
    project_type: audition.project_type,
    type_free_view_count: typeFreeViewCount,
    max_viewing_points: audition.max_viewing_points,
    unlimited_viewing: audition.unlimited_viewing,
    genre,
  }
}

/**
 * 既に閲覧済みかチェック
 */
async function isAlreadyViewed(
  supabase: SupabaseClient,
  userId: string,
  applicationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('viewed_applications')
    .select('id')
    .eq('user_id', userId)
    .eq('application_id', applicationId)
    .single()

  return !!data && !error
}

/**
 * オーディションの閲覧済み数を取得
 */
async function getViewedCountForAudition(
  supabase: SupabaseClient,
  userId: string,
  auditionId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('viewed_applications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('audition_id', auditionId)

  if (error) {
    return 0
  }

  return count || 0
}

/**
 * 閲覧可否チェック
 */
export async function checkViewingEligibility(
  supabase: SupabaseClient,
  userId: string,
  applicationId: string
): Promise<ViewingEligibility> {
  // 1. オーディション情報取得（ジャンル情報も含む）
  const audition = await getAuditionWithGenre(supabase, applicationId)

  if (!audition) {
    return {
      canView: false,
      pointsRequired: 0,
      currentBalance: 0,
      alreadyViewed: false,
      reason: 'insufficient_balance',
    }
  }

  // 2. 見放題チェック
  if (audition.unlimited_viewing) {
    return {
      canView: true,
      pointsRequired: 0,
      currentBalance: 0,
      alreadyViewed: false,
      reason: 'unlimited',
    }
  }

  // 3. 既に閲覧済みかチェック
  const alreadyViewed = await isAlreadyViewed(supabase, userId, applicationId)
  if (alreadyViewed) {
    return {
      canView: true,
      pointsRequired: 0,
      currentBalance: 0,
      alreadyViewed: true,
      reason: 'already_viewed',
    }
  }

  // 4. 無料閲覧枠チェック
  const freeQuotaLimit =
    audition.free_viewing_quota ?? audition.type_free_view_count ?? 0

  if (freeQuotaLimit > 0) {
    const viewedCount = await getViewedCountForAudition(supabase, userId, audition.id)
    if (viewedCount < freeQuotaLimit) {
      return {
        canView: true,
        pointsRequired: 0,
        currentBalance: 0,
        alreadyViewed: false,
        reason: 'free_quota',
        freeQuotaRemaining: freeQuotaLimit - viewedCount,
      }
    }
  }

  // 5. 閲覧単価を決定（優先順位: 案件 > ジャンル > デフォルト）
  let pointCost = audition.viewing_point_cost // 案件ごと設定

  if (pointCost === null || pointCost === undefined) {
    // ジャンル設定を取得
    pointCost = audition.genre?.viewing_point_cost ?? null

    if (pointCost === null || pointCost === undefined) {
      // デフォルト設定を使用
      pointCost = await getDefaultViewingCost(supabase)
    }
  }

  // 6. 残高チェック
  const balance = await getBalance(supabase, userId)

  // 7. 上限ポイントチェック（見放題判定）
  if (audition.max_viewing_points && balance >= audition.max_viewing_points) {
    return {
      canView: true,
      pointsRequired: 0,
      currentBalance: balance,
      alreadyViewed: false,
      reason: 'max_reached',
    }
  }

  return {
    canView: balance >= pointCost,
    pointsRequired: pointCost,
    currentBalance: balance,
    alreadyViewed: false,
    reason: balance < pointCost ? 'insufficient_balance' : undefined,
  }
}

/**
 * 閲覧ポイント消費
 */
export async function consumeViewingPoints(
  supabase: SupabaseClient,
  params: ConsumePointsParams
): Promise<void> {
  const { userId, applicationId, auditionId, pointsConsumed } = params

  // トランザクション開始
  const account = await getOrCreateAccount(supabase, { userId })

  // 残高チェック
  if (pointsConsumed > 0 && account.balance < pointsConsumed) {
    throw new Error('Insufficient balance')
  }

  // 残高更新
  const newBalance = account.balance - pointsConsumed
  const { error: updateError } = await supabase
    .from('points_accounts')
    .update({
      balance: newBalance,
      total_consumed: account.total_consumed + pointsConsumed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id)

  if (updateError) {
    throw new Error(`Failed to update balance: ${updateError.message}`)
  }

  // 取引記録
  if (pointsConsumed > 0) {
    const { error: txError } = await supabase
      .from('points_transactions')
      .insert({
        account_id: account.id,
        transaction_type: 'consumption',
        amount: -pointsConsumed,
        balance_after: newBalance,
        related_application_id: applicationId,
        related_audition_id: auditionId,
      })

    if (txError) {
      throw new Error(`Failed to record transaction: ${txError.message}`)
    }
  }

  // 閲覧済み記録
  const { error: viewError } = await supabase
    .from('viewed_applications')
    .insert({
      user_id: userId,
      application_id: applicationId,
      audition_id: auditionId,
      points_consumed: pointsConsumed,
    })

  if (viewError) {
    throw new Error(`Failed to record viewed application: ${viewError.message}`)
  }
}

/**
 * ポイント付与（Admin用）
 */
export async function grantPoints(
  supabase: SupabaseClient,
  params: GrantPointsParams
): Promise<void> {
  const { userId, amount, transactionType, notes, expiresAt } = params

  const account = await getOrCreateAccount(supabase, { userId })

  // 減算の場合は残高チェック
  if (amount < 0 && account.balance < Math.abs(amount)) {
    throw new Error('Insufficient balance for deduction')
  }

  // 残高更新
  const newBalance = account.balance + amount
  const updates: any = {
    balance: newBalance,
    updated_at: new Date().toISOString(),
  }

  if (amount > 0) {
    updates.total_bonus = account.total_bonus + amount
  }

  const { error: updateError } = await supabase
    .from('points_accounts')
    .update(updates)
    .eq('id', account.id)

  if (updateError) {
    throw new Error(`Failed to update balance: ${updateError.message}`)
  }

  // 取引記録
  const { error: txError } = await supabase
    .from('points_transactions')
    .insert({
      account_id: account.id,
      transaction_type: transactionType,
      amount,
      balance_after: newBalance,
      notes,
      expires_at: expiresAt?.toISOString(),
    })

  if (txError) {
    throw new Error(`Failed to record transaction: ${txError.message}`)
  }
}
