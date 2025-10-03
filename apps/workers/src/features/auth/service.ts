import type { AppContext } from '../../types'
import type { SupabaseUserRow } from '@casto/shared'
import { createSupabaseClient } from '../../lib/supabase'
import { upsertLineUser as upsertLineUserService } from '../users/service'

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
): Promise<SupabaseUserRow> {
  const supabase = createSupabaseClient(c)

  // users/service.ts の共通ロジックを利用
  const user = await upsertLineUserService(supabase, profile.userId, {
    name: profile.displayName,
    picture: profile.pictureUrl
  })

  return user
}
