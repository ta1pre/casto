import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupabaseUserRow } from '@casto/shared'
import { mapRoles, serializeUserResponse } from '@casto/shared'

export type GenericSupabaseClient = SupabaseClient<any, any, any>

export async function findUserByLineId(
  client: GenericSupabaseClient,
  lineUserId: string
) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('line_user_id', lineUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as SupabaseUserRow | null) ?? null
}

export async function findUserById(
  client: GenericSupabaseClient,
  id: string
) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as SupabaseUserRow | null) ?? null
}

export async function findUserByEmail(
  client: GenericSupabaseClient,
  email: string
) {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as SupabaseUserRow | null) ?? null
}

export async function upsertLineUser(
  client: GenericSupabaseClient,
  lineUserId: string,
  profile: { name?: string; picture?: string; email?: string | null }
) {
  const existing = await findUserByLineId(client, lineUserId)

  if (existing) {
    const { data, error } = await client
      .from('users')
      .update({
        display_name: profile.name ?? existing.display_name ?? 'LINEユーザー'
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as SupabaseUserRow
  }

  const { data, error } = await client
    .from('users')
    .insert({
      line_user_id: lineUserId,
      display_name: profile.name ?? 'LINEユーザー',
      role: 'applicant',
      email: profile.email?.toLowerCase() ?? null,
      token_version: 0
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as SupabaseUserRow
}

export async function upsertEmailUser(
  client: GenericSupabaseClient,
  email: string,
  options: { displayName?: string; role?: string }
) {
  const normalizedEmail = email.toLowerCase()
  const existing = await findUserByEmail(client, normalizedEmail)

  if (existing) {
    const { data, error } = await client
      .from('users')
      .update({
        display_name: options.displayName ?? existing.display_name ?? normalizedEmail,
        role: options.role ?? existing.role ?? 'organizer'
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data as SupabaseUserRow
  }

  const { data, error } = await client
    .from('users')
    .insert({
      email: normalizedEmail,
      display_name: options.displayName ?? normalizedEmail,
      role: options.role ?? 'organizer',
      token_version: 0
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as SupabaseUserRow
}
