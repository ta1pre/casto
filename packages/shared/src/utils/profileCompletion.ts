/**
 * プロフィール完成度計算ユーティリティ
 * 
 * [TDT][DRY] フロントエンド/バックエンド共通ロジック
 */

import type {
  TalentProfileInput,
  TalentProfileRow,
  ProfileCompletionResult,
  ProfileCompletionSections
} from '../types/profile'

/**
 * プロフィール完成度を計算
 * 
 * @param profile - プロフィール入力データまたはDB行データ
 * @returns 完成度（0-100）とセクション状態
 * 
 * 計算ルール [DRY]:
 * - 基本情報: 各4% (芸名、性別、生年月日、都道府県、職業)
 * - 写真: 1枚でも20%
 * - プロフィール詳細: 身長2%, 体重2%, 3サイズ各2%, 自己PR10%
 * - 所属: 所属形態20% (事務所名はカウントしない)
 * - SNS: 各4% (Twitter, Instagram, TikTok, YouTube, フォロワー数)
 */
export function calculateTalentProfileCompletion(
  profile: Partial<TalentProfileInput> | Partial<TalentProfileRow>
): ProfileCompletionResult {
  let completionRate = 0

  // 基本情報セクション（各4%）
  if (profile.stage_name) completionRate += 4
  if (profile.gender) completionRate += 4
  if (profile.birthdate) completionRate += 4
  if (profile.prefecture) completionRate += 4
  if (profile.occupation) completionRate += 4

  // 写真セクション（1枚でも20%）
  if (profile.photo_face_url || profile.photo_full_body_url) {
    completionRate += 20
  }

  // プロフィール詳細セクション
  if (profile.height !== null && profile.height !== undefined) completionRate += 2
  if (profile.weight !== null && profile.weight !== undefined) completionRate += 2
  if (profile.bust !== null && profile.bust !== undefined) completionRate += 2
  if (profile.waist !== null && profile.waist !== undefined) completionRate += 2
  if (profile.hip !== null && profile.hip !== undefined) completionRate += 2
  if (profile.achievements) completionRate += 10

  // 所属・ステータスセクション（所属形態のみ20%、事務所名はカウントしない）
  if (profile.affiliation_type) completionRate += 20

  // SNS情報セクション（各4%）
  if (profile.twitter) completionRate += 4
  if (profile.instagram) completionRate += 4
  if (profile.tiktok) completionRate += 4
  if (profile.youtube) completionRate += 4
  if (profile.followers) completionRate += 4

  // セクション状態（少なくとも1つ入力されているか）
  const hasBasicInfo = Boolean(
    profile.stage_name ||
    profile.gender ||
    profile.birthdate ||
    profile.prefecture ||
    profile.occupation
  )

  const hasPhoto = Boolean(
    profile.photo_face_url || profile.photo_full_body_url
  )

  const hasDetailInfo = Boolean(
    profile.height !== null && profile.height !== undefined ||
    profile.weight !== null && profile.weight !== undefined ||
    profile.bust !== null && profile.bust !== undefined ||
    profile.waist !== null && profile.waist !== undefined ||
    profile.hip !== null && profile.hip !== undefined ||
    profile.achievements
  )

  const hasAffiliation = Boolean(profile.affiliation_type)

  const hasSns = Boolean(
    profile.twitter ||
    profile.instagram ||
    profile.tiktok ||
    profile.youtube ||
    profile.followers
  )

  const sections: ProfileCompletionSections = {
    basic: hasBasicInfo,
    photo: hasPhoto,
    detail: hasDetailInfo,
    affiliation: hasAffiliation,
    sns: hasSns
  }

  return {
    completionRate: Math.min(100, completionRate),
    sections
  }
}

/**
 * 基本情報が完成しているかチェック（必須項目のみ）
 * 
 * @param profile - プロフィールデータ
 * @returns true: 必須項目すべて入力済み
 */
export function isBasicInfoComplete(
  profile: Partial<TalentProfileInput> | Partial<TalentProfileRow>
): boolean {
  return Boolean(
    profile.stage_name &&
    profile.gender &&
    profile.prefecture
  )
}
