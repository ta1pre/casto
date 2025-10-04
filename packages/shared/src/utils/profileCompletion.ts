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
 */
export function calculateTalentProfileCompletion(
  profile: Partial<TalentProfileInput> | Partial<TalentProfileRow>
): ProfileCompletionResult {
  // 基本情報セクション（必須3項目）
  const hasBasicInfo = Boolean(
    profile.stage_name &&
    profile.gender &&
    profile.prefecture
  )

  // 写真セクション（face or full_body）
  const hasPhoto = Boolean(
    profile.photo_face_url || profile.photo_full_body_url
  )

  // 詳細情報セクション（体型・自己PR等、いずれか1つ以上）
  const hasDetailInfo = Boolean(
    profile.height !== null && profile.height !== undefined ||
    profile.weight !== null && profile.weight !== undefined ||
    profile.bust !== null && profile.bust !== undefined ||
    profile.waist !== null && profile.waist !== undefined ||
    profile.hip !== null && profile.hip !== undefined ||
    profile.achievements
  )

  // 所属・ステータスセクション（いずれか1つ以上）
  const hasAffiliation = Boolean(
    profile.affiliation_type || profile.agency
  )

  // SNS情報セクション（いずれか1つ以上）
  const hasSns = Boolean(
    profile.twitter ||
    profile.instagram ||
    profile.tiktok ||
    profile.youtube ||
    profile.followers
  )

  // セクション状態
  const sections: ProfileCompletionSections = {
    basic: hasBasicInfo,
    photo: hasPhoto,
    detail: hasDetailInfo,
    affiliation: hasAffiliation,
    sns: hasSns
  }

  // 完成度計算（各セクション20%）
  const completionRate = Object.values(sections).reduce(
    (total, sectionFilled) => total + (sectionFilled ? 20 : 0),
    0
  )

  return {
    completionRate,
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
