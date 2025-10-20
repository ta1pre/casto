/**
 * ポイント機能のバリデーション
 * 
 * 設計原則: [SF][DRY]
 * - Zodスキーマで型安全なバリデーション
 * - エラーメッセージは日本語で明確に
 */

import { z } from 'zod'

// TransactionType
export const transactionTypeSchema = z.enum([
  'purchase',
  'consumption',
  'admin_grant',
  'admin_deduct',
  'monthly_bonus',
  'welcome_bonus',
  'referral_bonus',
])

// AccountType
export const accountTypeSchema = z.enum(['organizer', 'talent'])

// ポイント購入リクエスト
export const pointsPurchaseRequestSchema = z.object({
  planId: z.string().uuid('プランIDは有効なUUIDである必要があります'),
})

// ポイント付与リクエスト（Admin）
export const pointsGrantRequestSchema = z.object({
  userId: z.string().uuid('ユーザーIDは有効なUUIDである必要があります'),
  amount: z.number().int('ポイントは整数である必要があります'),
  reason: z
    .string()
    .min(1, '理由は必須です')
    .max(500, '理由は500文字以内で入力してください'),
  transactionType: z
    .enum(['admin_grant', 'admin_deduct'])
    .optional()
    .default('admin_grant'),
})

// 閲覧可否チェックリクエスト
export const checkViewingRequestSchema = z.object({
  applicationId: z
    .string()
    .uuid('応募IDは有効なUUIDである必要があります'),
})

// 閲覧ポイント消費リクエスト
export const consumeViewingRequestSchema = z.object({
  applicationId: z
    .string()
    .uuid('応募IDは有効なUUIDである必要があります'),
})

// ポイントプラン作成リクエスト
export const createPointsPlanSchema = z.object({
  name: z
    .string()
    .min(1, 'プラン名は必須です')
    .max(255, 'プラン名は255文字以内で入力してください'),
  points: z
    .number()
    .int('ポイントは整数である必要があります')
    .positive('ポイントは正の数である必要があります'),
  price_jpy: z
    .number()
    .int('価格は整数である必要があります')
    .positive('価格は正の数である必要があります'),
  discount_rate: z
    .number()
    .int('割引率は整数である必要があります')
    .min(0, '割引率は0以上である必要があります')
    .max(100, '割引率は100以下である必要があります')
    .optional()
    .default(0),
  display_order: z
    .number()
    .int('表示順は整数である必要があります')
    .min(0, '表示順は0以上である必要があります')
    .optional()
    .default(0),
})

// ポイントプラン更新リクエスト
export const updatePointsPlanSchema = createPointsPlanSchema.partial()

// システム設定更新リクエスト
export const updatePointsSettingsSchema = z.object({
  default_viewing_point_cost: z
    .number()
    .int('デフォルト閲覧単価は整数である必要があります')
    .positive('デフォルト閲覧単価は正の数である必要があります')
    .optional(),
  points_feature_enabled: z.boolean().optional(),
})

// ジャンル別単価更新リクエスト
export const updateGenreCostSchema = z.object({
  viewing_point_cost: z
    .number()
    .int('閲覧単価は整数である必要があります')
    .positive('閲覧単価は正の数である必要があります')
    .nullable(),
})

// オーディション作成時のポイント設定
export const auditionPointsSettingsSchema = z.object({
  viewing_point_cost: z
    .number()
    .int('閲覧単価は整数である必要があります')
    .positive('閲覧単価は正の数である必要があります')
    .nullable()
    .optional(),
  free_viewing_quota: z
    .number()
    .int('無料閲覧枠は整数である必要があります')
    .min(0, '無料閲覧枠は0以上である必要があります')
    .nullable()
    .optional(),
  max_viewing_points: z
    .number()
    .int('上限ポイントは整数である必要があります')
    .positive('上限ポイントは正の数である必要があります')
    .nullable()
    .optional(),
  unlimited_viewing: z.boolean().optional().default(false),
})

// 型推論用
export type PointsPurchaseRequest = z.infer<typeof pointsPurchaseRequestSchema>
export type PointsGrantRequest = z.infer<typeof pointsGrantRequestSchema>
export type CheckViewingRequest = z.infer<typeof checkViewingRequestSchema>
export type ConsumeViewingRequest = z.infer<typeof consumeViewingRequestSchema>
export type CreatePointsPlan = z.infer<typeof createPointsPlanSchema>
export type UpdatePointsPlan = z.infer<typeof updatePointsPlanSchema>
export type UpdatePointsSettings = z.infer<typeof updatePointsSettingsSchema>
export type UpdateGenreCost = z.infer<typeof updateGenreCostSchema>
export type AuditionPointsSettings = z.infer<typeof auditionPointsSettingsSchema>
