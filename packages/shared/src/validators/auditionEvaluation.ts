/**
 * オーディション評価バリデーション
 * [SF][REH] Zodスキーマによる共通バリデーション
 */

import { z } from 'zod'

/**
 * 評価作成スキーマ
 */
export const createAuditionEvaluationSchema = z.object({
  score: z.number()
    .min(0, { message: 'スコアは0以上を入力してください' })
    .max(100, { message: 'スコアは100以下を入力してください' })
    .optional(),
  
  comments: z.string()
    .max(2000, { message: 'コメントは2000文字以内で入力してください' })
    .optional(),
  
  result: z.enum(['pending', 'passed', 'rejected'], {
    errorMap: () => ({ message: '評価結果が不正です' })
  }).optional(),
})

/**
 * 評価更新スキーマ
 */
export const updateAuditionEvaluationSchema = z.object({
  score: z.number()
    .min(0, { message: 'スコアは0以上を入力してください' })
    .max(100, { message: 'スコアは100以下を入力してください' })
    .optional(),
  
  comments: z.string()
    .max(2000, { message: 'コメントは2000文字以内で入力してください' })
    .optional(),
  
  result: z.enum(['pending', 'passed', 'rejected'], {
    errorMap: () => ({ message: '評価結果が不正です' })
  }).optional(),
})

/**
 * 型推論用
 */
export type CreateAuditionEvaluationInput = z.infer<typeof createAuditionEvaluationSchema>
export type UpdateAuditionEvaluationInput = z.infer<typeof updateAuditionEvaluationSchema>
