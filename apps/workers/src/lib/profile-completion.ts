/**
 * プロフィール充実度計算
 * 
 * [CA][PA] ユーザープロフィールの完成度を計算し、通知でプロフィール充実を促進
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * プロフィール充実度の重み付け
 * 
 * 各フィールドの重要度に応じて重み付けを設定
 * 合計100%になるように調整
 */
const PROFILE_WEIGHTS = {
  // 基本情報（30%）
  displayName: 10,
  bio: 10,
  birthdate: 10,
  
  // プロフィール写真・動画（30%）
  profileImageUrl: 15,
  profileVideoUrl: 15,
  
  // 経歴・スキル（25%）
  experiences: 15,  // 経歴が1件以上
  skills: 10,        // スキルが3件以上
  
  // 連絡先（15%）
  email: 10,
  phoneNumber: 5,
} as const

/**
 * プロフィール充実度を計算
 * 
 * @param userId - ユーザーID
 * @param supabase - Supabaseクライアント
 * @returns プロフィール充実度（0-100）
 */
export async function calculateProfileCompletion(
  userId: string,
  supabase: SupabaseClient
): Promise<number> {
  try {
    // ユーザープロフィールを取得
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.warn('[ProfileCompletion] Failed to fetch user:', error?.message)
      return 0
    }

    let completionScore = 0

    // 基本情報
    if (user.display_name) completionScore += PROFILE_WEIGHTS.displayName
    if (user.bio && user.bio.length >= 10) completionScore += PROFILE_WEIGHTS.bio
    if (user.birthdate) completionScore += PROFILE_WEIGHTS.birthdate

    // プロフィール写真・動画
    if (user.profile_image_url) completionScore += PROFILE_WEIGHTS.profileImageUrl
    if (user.profile_video_url) completionScore += PROFILE_WEIGHTS.profileVideoUrl

    // 連絡先
    if (user.email) completionScore += PROFILE_WEIGHTS.email
    if (user.phone_number) completionScore += PROFILE_WEIGHTS.phoneNumber

    // 経歴（talent_experiencesテーブル）
    if (user.roles?.includes('talent')) {
      const { data: experiences } = await supabase
        .from('talent_experiences')
        .select('id')
        .eq('talent_id', userId)
        .limit(1)

      if (experiences && experiences.length > 0) {
        completionScore += PROFILE_WEIGHTS.experiences
      }
    }

    // スキル（talent_skillsテーブル）
    if (user.roles?.includes('talent')) {
      const { data: skills } = await supabase
        .from('talent_skills')
        .select('id')
        .eq('talent_id', userId)
        .limit(3)

      if (skills && skills.length >= 3) {
        completionScore += PROFILE_WEIGHTS.skills
      }
    }

    // 0-100の範囲に収める
    return Math.min(100, Math.max(0, Math.round(completionScore)))
  } catch (error) {
    console.error('[ProfileCompletion] Error calculating profile completion:', error)
    return 0
  }
}

/**
 * プロフィール充実度のステータスを取得
 * 
 * @param completionRate - 充実度（0-100）
 * @returns ステータスラベル
 */
export function getProfileCompletionStatus(completionRate: number): string {
  if (completionRate >= 90) return '完璧'
  if (completionRate >= 70) return 'とても良い'
  if (completionRate >= 50) return '良い'
  if (completionRate >= 30) return 'もう少し'
  return '始めたばかり'
}

/**
 * 次に充実させるべきフィールドを提案
 * 
 * @param userId - ユーザーID
 * @param supabase - Supabaseクライアント
 * @returns 提案メッセージ
 */
export async function suggestNextProfileFields(
  userId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const suggestions: string[] = []

  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!user) return suggestions

    // 優先度順に提案
    if (!user.profile_image_url) suggestions.push('プロフィール写真')
    if (!user.bio || user.bio.length < 10) suggestions.push('自己紹介文')
    if (!user.profile_video_url) suggestions.push('プロフィール動画')
    if (!user.birthdate) suggestions.push('生年月日')
    if (!user.phone_number) suggestions.push('電話番号')

    // 最大3件まで
    return suggestions.slice(0, 3)
  } catch (error) {
    console.error('[ProfileCompletion] Error suggesting fields:', error)
    return []
  }
}
