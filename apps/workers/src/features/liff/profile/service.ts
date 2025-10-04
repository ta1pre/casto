/**
 * タレントプロフィールサービス層
 * 
 * [CA][REH] Supabaseとのやり取り、完成度計算、バリデーション
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TalentProfileInput,
  TalentProfileRow,
  TalentProfileResponse
} from '@casto/shared'
import {
  calculateTalentProfileCompletion,
  validateTalentProfile
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * ユーザーIDからプロフィールを取得
 */
export async function getTalentProfile(
  client: GenericSupabaseClient,
  userId: string
): Promise<TalentProfileRow | null> {
  const { data, error } = await client
    .from('talent_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as TalentProfileRow | null) ?? null
}

/**
 * プロフィールをupsert（挿入or更新）
 * 
 * @param client - Supabaseクライアント
 * @param userId - ユーザーID
 * @param input - プロフィール入力データ
 * @returns 更新後のプロフィール
 */
export async function upsertTalentProfile(
  client: GenericSupabaseClient,
  userId: string,
  input: TalentProfileInput
): Promise<TalentProfileRow> {
  // バリデーション [REH]
  const validation = validateTalentProfile(input)
  if (!validation.valid) {
    const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
    throw new Error(`Validation failed: ${errorMessages}`)
  }

  // 完成度計算 [DRY]
  const { completionRate, sections } = calculateTalentProfileCompletion(input)

  // DB用データ準備
  const rowData: Partial<TalentProfileRow> = {
    user_id: userId,
    stage_name: input.stage_name,
    gender: input.gender,
    birthdate: input.birthdate,
    prefecture: input.prefecture,
    occupation: input.occupation ?? null,
    height: input.height ?? null,
    weight: input.weight ?? null,
    bust: input.bust ?? null,
    waist: input.waist ?? null,
    hip: input.hip ?? null,
    achievements: input.achievements ?? null,
    affiliation_type: input.affiliation_type ?? null,
    agency: input.agency ?? null,
    twitter: input.twitter ?? null,
    instagram: input.instagram ?? null,
    tiktok: input.tiktok ?? null,
    youtube: input.youtube ?? null,
    followers: input.followers ?? null,
    photo_face_url: input.photo_face_url ?? null,
    photo_full_body_url: input.photo_full_body_url ?? null,
    completion_rate: completionRate,
    completion_sections: sections as unknown as Record<string, unknown>
  }

  // Upsert実行
  const { data, error } = await client
    .from('talent_profiles')
    .upsert(rowData, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as TalentProfileRow
}

/**
 * プロフィール行データをレスポンス型に変換
 */
export function serializeTalentProfileResponse(row: TalentProfileRow): TalentProfileResponse {
  return {
    user_id: row.user_id,
    stage_name: row.stage_name,
    gender: row.gender,
    birthdate: row.birthdate,
    prefecture: row.prefecture,
    occupation: row.occupation,
    height: row.height,
    weight: row.weight,
    bust: row.bust,
    waist: row.waist,
    hip: row.hip,
    achievements: row.achievements,
    affiliation_type: row.affiliation_type,
    agency: row.agency,
    twitter: row.twitter,
    instagram: row.instagram,
    tiktok: row.tiktok,
    youtube: row.youtube,
    followers: row.followers,
    photo_face_url: row.photo_face_url,
    photo_full_body_url: row.photo_full_body_url,
    completion_rate: row.completion_rate,
    completion_sections: row.completion_sections as any,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}
