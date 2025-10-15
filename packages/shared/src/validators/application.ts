/**
 * 応募バリデーション
 * [SF][REH] Zodスキーマによる共通バリデーション
 */

import { z } from 'zod'

/**
 * 応募作成スキーマ
 */
export const submitApplicationSchema = z.object({
  auditionId: z.string().uuid({ message: '有効なオーディションIDを指定してください' }),
  
  additionalMessage: z.string()
    .max(2000, { message: '追加メッセージは2000文字以内で入力してください' })
    .optional(),
  
  additionalUrls: z.array(
    z.string().url({ message: '有効なURL形式で入力してください' })
  )
    .max(5, { message: 'URLは最大5件まで追加可能です' })
    .optional(),
})

/**
 * 応募更新スキーマ（辞退など）
 */
export const updateApplicationSchema = z.object({
  status: z.enum(['withdrawn'], {
    errorMap: () => ({ message: '更新可能なステータスは"withdrawn"のみです' })
  }),
})

/**
 * 型推論用
 */
export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
