/**
 * オーディションバリデーション
 * [SF][REH] Zodスキーマによる共通バリデーション
 */

import { z } from 'zod'

/**
 * オーディション作成スキーマ
 */
export const createAuditionSchema = z.object({
  title: z.string()
    .min(3, { message: 'タイトルは3文字以上で入力してください' })
    .max(200, { message: 'タイトルは200文字以内で入力してください' }),
  
  description: z.string()
    .max(5000, { message: '説明は5000文字以内で入力してください' })
    .optional(),
  
  requirements: z.string().optional(),
  
  shortDescription: z.string()
    .max(100, { message: 'SNS向け短文は100文字以内で入力してください' })
    .optional(),
  
  coverImageUrl: z.string()
    .url({ message: '有効なURL形式で入力してください' })
    .regex(/^https?:\/\//, { message: 'http://またはhttps://で始まるURLを入力してください' })
    .optional(),
  
  coverImageAlt: z.string()
    .max(120, { message: '代替テキストは120文字以内で入力してください' })
    .optional(),
  
  applicationStartDate: z.string()
    .datetime({ message: '有効な日時形式で入力してください' }),
  
  applicationEndDate: z.string()
    .datetime({ message: '有効な日時形式で入力してください' }),
  
  maxApplicants: z.number()
    .int({ message: '整数で入力してください' })
    .positive({ message: '1以上の値を入力してください' })
    .optional(),
  
  projectType: z.enum(['audition', 'job'], {
    errorMap: () => ({ message: 'プロジェクトタイプは"audition"または"job"を選択してください' })
  }),
  
  genreIds: z.array(z.string().uuid({ message: '有効なジャンルIDを指定してください' }))
    .max(3, { message: 'ジャンルは最大3件まで選択可能です' })
    .optional(),
  
  areaId: z.string().uuid({ message: '有効なエリアIDを指定してください' })
    .optional(),
}).refine(
  (data) => new Date(data.applicationEndDate) > new Date(data.applicationStartDate),
  {
    message: '募集終了日は募集開始日より後の日時を指定してください',
    path: ['applicationEndDate'],
  }
)

/**
 * オーディション更新スキーマ
 */
export const updateAuditionSchema = z.object({
  title: z.string()
    .min(3, { message: 'タイトルは3文字以上で入力してください' })
    .max(200, { message: 'タイトルは200文字以内で入力してください' })
    .optional(),
  
  description: z.string()
    .max(5000, { message: '説明は5000文字以内で入力してください' })
    .optional(),
  
  requirements: z.string().optional(),
  
  shortDescription: z.string()
    .max(100, { message: 'SNS向け短文は100文字以内で入力してください' })
    .optional(),
  
  coverImageUrl: z.string()
    .url({ message: '有効なURL形式で入力してください' })
    .regex(/^https?:\/\//, { message: 'http://またはhttps://で始まるURLを入力してください' })
    .optional(),
  
  coverImageAlt: z.string()
    .max(120, { message: '代替テキストは120文字以内で入力してください' })
    .optional(),
  
  applicationStartDate: z.string()
    .datetime({ message: '有効な日時形式で入力してください' })
    .optional(),
  
  applicationEndDate: z.string()
    .datetime({ message: '有効な日時形式で入力してください' })
    .optional(),
  
  maxApplicants: z.number()
    .int({ message: '整数で入力してください' })
    .positive({ message: '1以上の値を入力してください' })
    .optional(),
  
  status: z.enum(['draft', 'published', 'closed', 'cancelled'], {
    errorMap: () => ({ message: 'ステータスが不正です' })
  }).optional(),
  
  genreIds: z.array(z.string().uuid({ message: '有効なジャンルIDを指定してください' }))
    .max(3, { message: 'ジャンルは最大3件まで選択可能です' })
    .optional(),
  
  areaId: z.string().uuid({ message: '有効なエリアIDを指定してください' })
    .optional(),
}).refine(
  (data) => {
    if (data.applicationStartDate && data.applicationEndDate) {
      return new Date(data.applicationEndDate) > new Date(data.applicationStartDate)
    }
    return true
  },
  {
    message: '募集終了日は募集開始日より後の日時を指定してください',
    path: ['applicationEndDate'],
  }
)

/**
 * 型推論用
 */
export type CreateAuditionInput = z.infer<typeof createAuditionSchema>
export type UpdateAuditionInput = z.infer<typeof updateAuditionSchema>
