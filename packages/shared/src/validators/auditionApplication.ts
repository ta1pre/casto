/**
 * オーディション応募バリデーション
 * [SF][REH] Zodスキーマによる共通バリデーション
 */

import { z } from 'zod'
import { extraApplicationDataSchema } from './application'

/**
 * 応募作成スキーマ
 */
export const createAuditionApplicationSchema = z.object({
  auditionId: z.string().uuid({ message: '有効なオーディションIDを指定してください' }),
  extraApplicationData: z.union([extraApplicationDataSchema, z.record(z.unknown())]).optional(),
  liffAccessToken: z.string().optional().nullable(), // LINE通知用（オプション）
})

/**
 * 応募更新スキーマ（主催者のみ）
 */
export const updateAuditionApplicationSchema = z.object({
  currentStepId: z.string().uuid({ message: '有効なステップIDを指定してください' }).optional(),
  
  overallStatus: z.enum(['pending', 'in_progress', 'passed', 'rejected', 'withdrawn'], {
    errorMap: () => ({ message: 'ステータスが不正です' })
  }).optional(),
})

/**
 * 型推論用
 */
export type CreateAuditionApplicationInput = z.infer<typeof createAuditionApplicationSchema>
export type UpdateAuditionApplicationInput = z.infer<typeof updateAuditionApplicationSchema>
