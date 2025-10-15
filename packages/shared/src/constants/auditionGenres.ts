/**
 * オーディションジャンル定数
 * [SF][CA] ジャンルスラッグとラベルのマッピング
 */

import type { GenreSlug } from '../types/auditionGenre'

/**
 * ジャンルスラッグとラベルのマッピング
 */
export const GENRE_LABELS: Record<GenreSlug, string> = {
  idol: 'アイドル',
  dance: 'ダンサー',
  vocal: 'ボーカル・歌手',
  acting: '俳優・女優',
  model: 'モデル',
  voice_actor: '声優',
  mc_host: 'MC・司会',
  creator: 'クリエイター',
  influencer: 'インフルエンサー',
  campaign: 'キャンペーンモデル',
  other: 'その他',
}

/**
 * ジャンルカテゴリ
 */
export const GENRE_CATEGORIES = {
  entertainment: 'エンタメ',
  fashion: 'ファッション',
  digital: 'デジタル',
  promotion: 'プロモーション',
  other: 'その他',
} as const

/**
 * プロジェクトタイプラベル
 */
export const PROJECT_TYPE_LABELS = {
  audition: 'オーディション',
  job: '求人',
} as const

/**
 * オーディションステータスラベル
 */
export const AUDITION_STATUS_LABELS = {
  draft: '下書き',
  published: '公開中',
  closed: '終了',
  cancelled: '中止',
} as const

/**
 * 応募ステータスラベル
 */
export const APPLICATION_STATUS_LABELS = {
  submitted: '審査中',
  under_review: '審査中',
  accepted: '合格',
  rejected: '不合格',
  withdrawn: '辞退',
} as const

/**
 * 審査結果ラベル
 */
export const REVIEW_DECISION_LABELS = {
  pending: '保留',
  accept: '合格',
  reject: '不合格',
} as const
