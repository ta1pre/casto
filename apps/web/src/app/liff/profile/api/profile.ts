/**
 * プロフィールAPI層
 * 
 * [CA][DRY] Workers APIとの通信処理
 */

import { apiFetch } from '@/shared/lib/api'
import type { TalentProfileInput, TalentProfileResponse } from '@casto/shared'

interface ProfileResponse {
  profile: TalentProfileResponse
}

/**
 * プロフィールを取得
 */
export async function fetchProfile(): Promise<TalentProfileResponse> {
  const data = await apiFetch<ProfileResponse>('/api/v1/liff/profile', {
    method: 'GET'
  })
  return data.profile
}

/**
 * プロフィールを保存（新規作成or更新）
 */
export async function saveProfile(input: TalentProfileInput): Promise<TalentProfileResponse> {
  const data = await apiFetch<ProfileResponse>('/api/v1/liff/profile', {
    method: 'POST',
    body: JSON.stringify(input)
  })
  return data.profile
}

/**
 * プロフィールを更新（完全上書き）
 */
export async function updateProfile(input: TalentProfileInput): Promise<TalentProfileResponse> {
  const data = await apiFetch<ProfileResponse>('/api/v1/liff/profile', {
    method: 'PUT',
    body: JSON.stringify(input)
  })
  return data.profile
}

/**
 * プロフィールを部分更新
 */
export async function patchProfile(input: Partial<TalentProfileInput>): Promise<TalentProfileResponse> {
  const data = await apiFetch<ProfileResponse>('/api/v1/liff/profile', {
    method: 'PATCH',
    body: JSON.stringify(input)
  })
  return data.profile
}
