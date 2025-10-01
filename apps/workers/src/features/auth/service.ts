import type { AppContext } from '../../types'
import { createSupabaseClient } from '../../lib/supabase'

export type LineProfile = {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

/**
 * LINE IDトークンを検証してプロフィール情報を取得
 */
export async function verifyLineIdToken(
  idToken: string,
  channelId: string
): Promise<LineProfile> {
  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LINE ID token verification failed: ${response.status} ${errorText}`)
  }

  const data = await response.json<{
    sub: string
    name: string
    picture?: string
  }>()

  return {
    userId: data.sub,
    displayName: data.name,
    pictureUrl: data.picture
  }
}

/**
 * LINEユーザーをDBにUPSERTして返す
 */
export async function upsertLineUser(
  c: AppContext,
  profile: LineProfile
): Promise<{
  id: string
  lineUserId: string
  displayName: string
  tokenVersion: number
}> {
  const supabase = createSupabaseClient(c)

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        is_active: true,
        token_version: 0
      },
      {
        onConflict: 'line_user_id',
        ignoreDuplicates: false
      }
    )
    .select('id, line_user_id, display_name, token_version')
    .single()

  if (error || !data) {
    throw new Error(`Failed to upsert LINE user: ${error?.message ?? 'Unknown error'}`)
  }

  return {
    id: data.id,
    lineUserId: data.line_user_id,
    displayName: data.display_name,
    tokenVersion: data.token_version
  }
}
