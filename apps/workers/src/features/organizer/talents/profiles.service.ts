/**
 * タレントプロフィールサービス（主催者側）
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * タレントプロフィール詳細取得（主催者用）
 */
export async function getTalentProfile(
  client: GenericSupabaseClient,
  talentId: string
) {
  const { data, error } = await client
    .from('talent_profiles')
    .select('*')
    .eq('user_id', talentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch talent profile: ${error.message}`)
  }

  // photo_urls配列から写真URLを取得（index 0=顔写真, 1=全身写真）
  const photoUrls = data.photo_urls || []
  
  // snake_case から camelCase へ変換
  return {
    userId: data.user_id,
    stageName: data.stage_name,
    gender: data.gender,
    birthdate: data.birthdate,
    prefecture: data.prefecture,
    occupation: data.occupation,
    height: data.height,
    weight: data.weight,
    bust: data.bust,
    waist: data.waist,
    hip: data.hip,
    achievements: data.achievements,
    affiliationType: data.affiliation_type,
    agency: data.agency,
    twitter: data.twitter,
    instagram: data.instagram,
    tiktok: data.tiktok,
    youtube: data.youtube,
    followers: data.followers,
    photoFaceUrl: photoUrls[0] || null,  // 顔写真
    photoFullBodyUrl: photoUrls[1] || null,  // 全身写真
    completionRate: data.completion_rate,
    completionSections: data.completion_sections,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
