/**
 * ポイント機能の共通フック
 * 
 * 設計原則: [SF][REH][PA]
 * - API呼び出しの抽象化
 * - エラーハンドリング
 * - ローディング状態管理
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/shared/lib/api'
import type {
  PointsAccount,
  PointsTransaction,
  PointsPlan,
  ViewingEligibility,
} from '@casto/shared'

/**
 * ポイントアカウント情報取得
 */
export function usePointsAccount() {
  const [account, setAccount] = useState<PointsAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ account: PointsAccount }>('/api/v1/points/account')
      setAccount(data.account)
    } catch (err) {
      console.error('[usePointsAccount] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch account')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccount()
  }, [fetchAccount])

  return {
    account,
    balance: account?.balance ?? 0,
    loading,
    error,
    refetch: fetchAccount,
  }
}

/**
 * 取引履歴取得
 */
export function usePointsTransactions(limit: number = 50, offset: number = 0) {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ transactions: PointsTransaction[]; total: number }>(
        `/api/v1/points/transactions?limit=${limit}&offset=${offset}`
      )
      setTransactions(data.transactions)
      setTotal(data.total)
    } catch (err) {
      console.error('[usePointsTransactions] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }, [limit, offset])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    total,
    loading,
    error,
    refetch: fetchTransactions,
  }
}

/**
 * ポイントプラン一覧取得
 */
export function usePointsPlans() {
  const [plans, setPlans] = useState<PointsPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<{ plans: PointsPlan[] }>('/api/v1/points/plans')
      setPlans(data.plans)
    } catch (err) {
      console.error('[usePointsPlans] Error:', err)
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
 * 閲覧可否チェック
 */
export function useCheckViewing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkViewing = useCallback(
    async (applicationId: string): Promise<ViewingEligibility | null> => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch<{ eligibility: ViewingEligibility }>('/api/v1/points/check-viewing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId }),
        })
        return data.eligibility
      } catch (err) {
        console.error('[useCheckViewing] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to check viewing')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    checkViewing,
    loading,
    error,
  }
}

/**
 * 閲覧ポイント消費
 */
export function useConsumeViewing() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const consumeViewing = useCallback(
    async (applicationId: string): Promise<{ success: boolean; pointsConsumed: number } | null> => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiFetch<{ success: boolean; pointsConsumed: number }>('/api/v1/points/consume-viewing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId }),
        })
        return data
      } catch (err) {
        console.error('[useConsumeViewing] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to consume viewing points')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    consumeViewing,
    loading,
    error,
  }
}
