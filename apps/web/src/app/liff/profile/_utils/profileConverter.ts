/**
 * プロフィールデータ変換ユーティリティ
 * 
 * [DRY] フォーム型 ⇔ API型の相互変換
 */

import type { TalentProfileInput, TalentProfileResponse } from '@casto/shared'
import type { ProfileFormData } from '../_components/types'

/**
 * 文字列を数値に変換（空文字列やNaNの場合はnull） [REH]
 */
function parseNumberOrNull(value: string): number | null {
  if (!value || value.trim() === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * フォームデータ → API入力データ
 */
export function formDataToApiInput(formData: ProfileFormData): TalentProfileInput {
  return {
    stage_name: formData.stageName,
    gender: formData.gender as 'male' | 'female' | 'other',
    birthdate: formData.birthdate || null,
    prefecture: formData.prefecture,
    occupation: formData.occupation || null,
    height: parseNumberOrNull(formData.height),
    weight: parseNumberOrNull(formData.weight),
    bust: parseNumberOrNull(formData.bust),
    waist: parseNumberOrNull(formData.waist),
    hip: parseNumberOrNull(formData.hip),
    achievements: formData.achievements || null,
    affiliation_type: (formData.affiliationType as 'freelance' | 'business-partner' | 'exclusive') || null,
    agency: formData.agency || null,
    twitter: formData.twitter || null,
    instagram: formData.instagram || null,
    tiktok: formData.tiktok || null,
    youtube: formData.youtube || null,
    followers: formData.followers || null
  }
}

/**
 * APIレスポンス → フォームデータ
 */
export function apiResponseToFormData(response: TalentProfileResponse): ProfileFormData {
  return {
    stageName: response.stage_name,
    gender: response.gender,
    birthdate: response.birthdate || '',
    prefecture: response.prefecture,
    occupation: response.occupation || '',
    height: response.height !== null ? String(response.height) : '',
    weight: response.weight !== null ? String(response.weight) : '',
    bust: response.bust !== null ? String(response.bust) : '',
    waist: response.waist !== null ? String(response.waist) : '',
    hip: response.hip !== null ? String(response.hip) : '',
    achievements: response.achievements || '',
    affiliationType: response.affiliation_type || '',
    agency: response.agency || '',
    twitter: response.twitter || '',
    instagram: response.instagram || '',
    tiktok: response.tiktok || '',
    youtube: response.youtube || '',
    followers: response.followers || ''
  }
}
