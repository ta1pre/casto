/**
 * ポイント機能の型定義
 * 
 * 設計原則: [SF][DRY][CA]
 * - user_id 使用（将来のキャスト対応も考慮）
 * - account_type で主催者/タレントを判別
 */

export type AccountType = 'organizer' | 'talent'

export type TransactionType =
  // 主催者向け
  | 'purchase'          // Stripe購入
  | 'consumption'       // 閲覧ポイント消費
  | 'admin_grant'       // Admin手動付与
  | 'admin_deduct'      // Admin手動減算
  | 'monthly_bonus'     // 月次ボーナス
  | 'welcome_bonus'     // 新規登録ボーナス
  | 'referral_bonus'    // 紹介ボーナス
  // 将来: キャスト向け
  // | 'audition_reward'
  // | 'tip_received'
  // | 'tip_sent'
  // | 'withdrawal'
  // | 'withdrawal_fee'

export interface PointsAccount {
  id: string
  user_id: string
  account_type: AccountType
  balance: number
  total_purchased: number
  total_consumed: number
  total_bonus: number
  created_at: string
  updated_at: string
}

export interface PointsTransaction {
  id: string
  account_id: string
  transaction_type: TransactionType
  amount: number
  balance_after: number
  related_application_id?: string | null
  related_audition_id?: string | null
  related_stripe_session_id?: string | null
  metadata?: Record<string, unknown> | null
  notes?: string | null
  expires_at?: string | null
  created_at: string
}

export interface PointsPlan {
  id: string
  name: string
  points: number
  price_jpy: number
  stripe_product_id?: string | null
  stripe_price_id?: string | null
  bonus_points: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ViewedApplication {
  id: string
  user_id: string
  application_id: string
  audition_id: string
  points_consumed: number
  viewed_at: string
}

export interface ViewingEligibility {
  canView: boolean
  pointsRequired: number
  currentBalance: number
  alreadyViewed: boolean
  reason?: 'unlimited' | 'free_quota' | 'max_reached' | 'insufficient_balance' | 'already_viewed'
  freeQuotaRemaining?: number
}

export interface PointsAccountSummary {
  account: PointsAccount
  recentTransactions: PointsTransaction[]
  totalTransactions: number
}

export interface PointsPurchaseRequest {
  planId: string
}

export interface PointsGrantRequest {
  userId: string
  amount: number
  reason: string
  transactionType?: 'admin_grant' | 'admin_deduct'
}

export interface CheckViewingRequest {
  applicationId: string
}

export interface ConsumeViewingRequest {
  applicationId: string
}
