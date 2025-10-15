/**
 * 審査バリデーション
 * [SF][REH] Zodスキーマによる共通バリデーション
 */

import { z } from 'zod'

/**
 * 審査作成スキーマ
 */
export const createReviewSchema = z.object({
  applicationId: z.string().uuid({ message: '有効な応募IDを指定してください' }),
  
  decision: z.enum(['pending', 'accept', 'reject'], {
    errorMap: () => ({ message: '審査結果は"pending"、"accept"、"reject"のいずれかを選択してください' })
  }),
  
  comment: z.string()
    .max(2000, { message: 'コメントは2000文字以内で入力してください' })
    .optional(),
  
  isFinal: z.boolean().optional().default(false),
})

/**
 * 審査更新スキーマ
 */
export const updateReviewSchema = z.object({
  decision: z.enum(['pending', 'accept', 'reject'], {
    errorMap: () => ({ message: '審査結果は"pending"、"accept"、"reject"のいずれかを選択してください' })
  }).optional(),
  
  comment: z.string()
    .max(2000, { message: 'コメントは2000文字以内で入力してください' })
    .optional(),
  
  isFinal: z.boolean().optional(),
})

/**
 * 型推論用
 */
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
