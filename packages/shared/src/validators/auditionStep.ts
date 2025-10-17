/**
 * オーディションステップバリデーション
 * [SF][REH] Zodスキーマによる共通バリデーション
 */

import { z } from 'zod'

/**
 * ステップ作成スキーマ
 */
export const createAuditionStepSchema = z.object({
  title: z.string()
    .min(1, { message: 'タイトルを入力してください' })
    .max(100, { message: 'タイトルは100文字以内で入力してください' }),
  
  description: z.string()
    .max(1000, { message: '説明は1000文字以内で入力してください' })
    .optional(),
  
  stepType: z.enum(['custom', 'voting'], {
    errorMap: () => ({ message: 'ステップ種別が不正です' })
  }).optional(),  // デフォルトは 'custom'、'document_screening' はサーバー側で自動生成
})

/**
 * ステップ更新スキーマ
 */
export const updateAuditionStepSchema = z.object({
  title: z.string()
    .min(1, { message: 'タイトルを入力してください' })
    .max(100, { message: 'タイトルは100文字以内で入力してください' })
    .optional(),
  
  description: z.string()
    .max(1000, { message: '説明は1000文字以内で入力してください' })
    .optional(),
})

/**
 * 型推論用
 */
export type CreateAuditionStepInput = z.infer<typeof createAuditionStepSchema>
export type UpdateAuditionStepInput = z.infer<typeof updateAuditionStepSchema>
