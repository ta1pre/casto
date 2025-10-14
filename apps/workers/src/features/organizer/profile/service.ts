/**
 * 主催者プロフィールサービス
 * [SF][CA][DRY] Supabaseとのデータ層通信
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SupabaseOrganizerProfileRow,
  OrganizerProfile,
  OrganizerProfileUpsertRequest,
} from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

/**
 * snake_caseからcamelCaseへ変換
 */
function toOrganizerProfile(row: SupabaseOrganizerProfileRow): OrganizerProfile {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    logoUrl: row.logo_url || null,
    logoPositionX: row.logo_position_x ?? 0,
    logoPositionY: row.logo_position_y ?? 0,
    logoScale: row.logo_scale ?? 1,
    name: row.name,
    contactPerson: row.contact_person || null,
    prefecture: row.prefecture,
    addressDetail: row.address_detail,
    phone: row.phone,
    email: row.email || null,
    website: row.website || null,
    description: row.description,
    instagramUrl: row.instagram_url || null,
    xUrl: row.x_url || null,
    tiktokUrl: row.tiktok_url || null,
    youtubeUrl: row.youtube_url || null,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * プロフィール取得
 */
export async function getOrganizerProfile(
  client: GenericSupabaseClient,
  organizerId: string
): Promise<OrganizerProfile | null> {
  const { data, error } = await client
    .from('organizer_profiles')
    .select('*')
    .eq('organizer_id', organizerId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch organizer profile: ${error.message}`)
  }

  if (!data) {
    return null
  }

  return toOrganizerProfile(data as SupabaseOrganizerProfileRow)
}

/**
 * プロフィール作成
 */
export async function createOrganizerProfile(
  client: GenericSupabaseClient,
  organizerId: string,
  input: OrganizerProfileUpsertRequest
): Promise<OrganizerProfile> {
  const insertData = {
    organizer_id: organizerId,
    logo_url: input.logoUrl || null,
    logo_position_x: input.logoPositionX ?? 0,
    logo_position_y: input.logoPositionY ?? 0,
    logo_scale: input.logoScale ?? 1,
    name: input.name,
    contact_person: input.contactPerson || null,
    prefecture: input.prefecture,
    address_detail: input.addressDetail,
    phone: input.phone,
    email: input.email || null,
    website: input.website || null,
    description: input.description,
    instagram_url: input.instagramUrl || null,
    x_url: input.xUrl || null,
    tiktok_url: input.tiktokUrl || null,
    youtube_url: input.youtubeUrl || null,
    is_active: input.isActive ?? false,
  }

  const { data, error } = await client
    .from('organizer_profiles')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create organizer profile: ${error.message}`)
  }

  return toOrganizerProfile(data as SupabaseOrganizerProfileRow)
}

/**
 * プロフィール更新
 */
export async function updateOrganizerProfile(
  client: GenericSupabaseClient,
  organizerId: string,
  input: OrganizerProfileUpsertRequest
): Promise<OrganizerProfile> {
  const updateData = {
    logo_url: input.logoUrl || null,
    logo_position_x: input.logoPositionX ?? 0,
    logo_position_y: input.logoPositionY ?? 0,
    logo_scale: input.logoScale ?? 1,
    name: input.name,
    contact_person: input.contactPerson || null,
    prefecture: input.prefecture,
    address_detail: input.addressDetail,
    phone: input.phone,
    email: input.email || null,
    website: input.website || null,
    description: input.description,
    instagram_url: input.instagramUrl || null,
    x_url: input.xUrl || null,
    tiktok_url: input.tiktokUrl || null,
    youtube_url: input.youtubeUrl || null,
    is_active: input.isActive ?? false,
  }

  const { data, error } = await client
    .from('organizer_profiles')
    .update(updateData)
    .eq('organizer_id', organizerId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update organizer profile: ${error.message}`)
  }

  return toOrganizerProfile(data as SupabaseOrganizerProfileRow)
}

/**
 * プロフィール作成または更新（Upsert）
 */
export async function upsertOrganizerProfile(
  client: GenericSupabaseClient,
  organizerId: string,
  input: OrganizerProfileUpsertRequest
): Promise<OrganizerProfile> {
  const existing = await getOrganizerProfile(client, organizerId)

  if (existing) {
    return await updateOrganizerProfile(client, organizerId, input)
  } else {
    return await createOrganizerProfile(client, organizerId, input)
  }
}
