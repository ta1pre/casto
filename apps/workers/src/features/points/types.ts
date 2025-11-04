/**
 * ポイント機能の内部型定義
 * 
 * 設計原則: [SF][DRY]
 * - 共有型（@casto/shared）を再利用
 * - Workers固有の型のみ定義
 */

import type {
  PointsAccount,
  PointsTransaction,
  PointsPlan,
  ViewedApplication,
  ViewingEligibility,
} from '@casto/shared'

// 共有型を再エクスポート
export type {
  PointsAccount,
  PointsTransaction,
  PointsPlan,
  ViewedApplication,
  ViewingEligibility,
}

// Workers固有の型

export interface CreateAccountParams {
  userId: string
  accountType?: 'organizer' | 'talent'
}

export interface GrantPointsParams {
  userId: string
  amount: number
  transactionType: 'admin_grant' | 'admin_deduct' | 'monthly_bonus' | 'welcome_bonus'
  notes?: string
  expiresAt?: Date
}

export interface ConsumePointsParams {
  userId: string
  applicationId: string
  auditionId: string
  pointsConsumed: number
}

export interface PointsServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AuditionWithGenre {
  id: string
  viewing_point_cost: number | null
  free_viewing_quota: number | null
  project_type: 'audition' | 'job' | 'extra'
  type_viewing_point_cost: number | null
  type_free_view_count: number | null
  max_viewing_points: number | null
  unlimited_viewing: boolean
  genre?: {
    viewing_point_cost: number | null
  } | null
}
