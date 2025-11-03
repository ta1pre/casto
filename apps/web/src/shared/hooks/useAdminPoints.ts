/**
 * Admin向けポイント管理フック
 * 
 * 設計原則: [SF][REH][PA]
 * - 全アカウント管理
 * - ポイント手動付与/減算
 * - プラン・設定管理
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/shared/lib/api'
import type { PointsAccount, PointsPlan } from '@casto/shared'

/**
 * ジャンル別単価の型定義
 */
export interface GenreCost {
  id: string
  slug: string
  display_name: string
  viewing_point_cost: number | null
}

/**
 * 全アカウント一覧取得
 */
export function useAdminPointsAccounts(limit: number = 50, offset: number = 0) {
  const [accounts, setAccounts] = useState<PointsAccount[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ accounts: PointsAccount[]; total: number }>(
        `/api/v1/admin/points/accounts?limit=${limit}&offset=${offset}`
      )
      setAccounts(data.accounts)
      setTotal(data.total)
    } catch (err) {
      console.error('[useAdminPointsAccounts] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [limit, offset])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    total,
    loading,
    error,
    refetch: fetchAccounts,
  }
}

/**
 * アカウント詳細取得
 */
export function useAdminPointsAccountDetail(accountId: string | null) {
  const [account, setAccount] = useState<PointsAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccount = useCallback(async () => {
    if (!accountId) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ account: PointsAccount }>(`/api/v1/admin/points/accounts/${accountId}`)
      setAccount(data.account)
    } catch (err) {
      console.error('[useAdminPointsAccountDetail] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch account detail')
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    fetchAccount()
  }, [fetchAccount])

  return {
    account,
    loading,
    error,
    refetch: fetchAccount,
  }
}

/**
 * ポイント手動付与
 */
export function useGrantPoints() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const grantPoints = useCallback(
    async (params: {
      userId: string
      amount: number
      reason: string
      transactionType?: 'admin_grant' | 'admin_deduct'
    }): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)
        await apiFetch('/api/v1/admin/points/grant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        
        return true
      } catch (err) {
        console.error('[useGrantPoints] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to grant points')
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    grantPoints,
    loading,
    error,
  }
}

/**
 * プラン一覧取得（全て）
 */
export function useAdminPointsPlans() {
  const [plans, setPlans] = useState<PointsPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ plans: PointsPlan[] }>('/api/v1/admin/points/plans')
      setPlans(data.plans)
    } catch (err) {
      console.error('[useAdminPointsPlans] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch plans')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  }
}

/**
 * プラン作成
 */
export function useCreatePointsPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPlan = useCallback(
    async (plan: {
      name: string
      points: number
      price_jpy: number
      bonus_points?: number
      display_order?: number
    }): Promise<PointsPlan | null> => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch<{ plan: PointsPlan }>('/api/v1/admin/points/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plan),
        })
        return data.plan
      } catch (err) {
        console.error('[useCreatePointsPlan] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to create plan')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    createPlan,
    loading,
    error,
  }
}

/**
 * プラン更新
 */
export function useUpdatePointsPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePlan = useCallback(
    async (
      planId: string,
      updates: Partial<Omit<PointsPlan, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<PointsPlan | null> => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch<{ plan: PointsPlan }>(`/api/v1/admin/points/plans/${planId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        return data.plan
      } catch (err) {
        console.error('[useUpdatePointsPlan] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to update plan')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    updatePlan,
    loading,
    error,
  }
}

/**
 * プラン削除
 */
export function useDeletePointsPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await apiFetch(`/api/v1/admin/points/plans/${planId}`, {
        method: 'DELETE',
      })
      return true
    } catch (err) {
      console.error('[useDeletePointsPlan] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete plan')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    deletePlan,
    loading,
    error,
  }
}

/**
 * ジャンル別単価一覧取得
 */
export function useGenreCosts() {
  const [genres, setGenres] = useState<GenreCost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGenres = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ genres: GenreCost[] }>('/api/v1/admin/points/genre-costs')
      setGenres(data.genres)
    } catch (err) {
      console.error('[useGenreCosts] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch genre costs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  return {
    genres,
    loading,
    error,
    refetch: fetchGenres,
  }
}

/**
 * ジャンル別単価更新
 */
export function useUpdateGenreCost() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateGenreCost = useCallback(
    async (genreId: string, viewingPointCost: number | null): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)
        await apiFetch(`/api/v1/admin/points/genre-costs/${genreId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewing_point_cost: viewingPointCost }),
        })
        return true
      } catch (err) {
        console.error('[useUpdateGenreCost] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to update genre cost')
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    updateGenreCost,
    loading,
    error,
  }
}
