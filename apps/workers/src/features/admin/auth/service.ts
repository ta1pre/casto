/**
 * 管理者認証サービス
 * [SFT][REH] Supabase Authを使ったメール認証
 */

import type { AppContext } from '../../../types'
import type { RoleName } from '@casto/shared'
import { createSupabaseClient } from '../../../lib/supabase'

/**
 * メールアドレスとパスワードでサインアップ
 * 
 * Supabase Authで新規ユーザーを作成し、確認メールを送信
 */
export async function signUpWithEmail(
  c: AppContext,
  email: string,
  password: string
): Promise<{ userId: string; email: string; needsEmailConfirmation: boolean }> {
  const supabase = createSupabaseClient(c)
  
  // Supabase Authでユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${c.env.WEB_URL}/admin/auth/callback`,
    }
  })
  
  if (authError) {
    console.error('[signUpWithEmail] Supabase Auth error:', authError)
    throw new Error(`Sign up failed: ${authError.message}`)
  }
  
  if (!authData.user) {
    throw new Error('Sign up failed: No user returned')
  }
  
  // usersテーブルにレコード作成（auth.usersとは別）
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: authData.user.email,
      display_name: email.split('@')[0], // デフォルト表示名
      is_active: true,
    })
    .select()
    .single()
  
  if (insertError) {
    console.error('[signUpWithEmail] Failed to create user record:', insertError)
    // auth.usersは作成済みなので、エラーでもユーザーIDは返す
  }
  
  return {
    userId: authData.user.id,
    email: authData.user.email!,
    needsEmailConfirmation: !authData.user.email_confirmed_at,
  }
}

/**
 * ユーザーにロールを付与
 */
export async function assignRole(
  c: AppContext,
  userId: string,
  roleName: RoleName
): Promise<void> {
  const supabase = createSupabaseClient(c)
  
  // ロールIDを取得
  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single()
  
  if (roleError || !role) {
    throw new Error(`Role not found: ${roleName}`)
  }
  
  // user_rolesに挿入（既に存在する場合は無視）
  const { error: assignError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: role.id,
    })
  
  if (assignError) {
    // UNIQUE制約違反の場合は無視
    if (!assignError.message.includes('duplicate') && !assignError.code?.includes('23505')) {
      throw new Error(`Failed to assign role: ${assignError.message}`)
    }
  }
}

/**
 * メールアドレスとパスワードでログイン
 */
export async function signInWithEmail(
  c: AppContext,
  email: string,
  password: string
): Promise<{ userId: string; email: string; accessToken: string; refreshToken: string }> {
  const supabase = createSupabaseClient(c)
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (authError) {
    console.error('[signInWithEmail] Supabase Auth error:', authError)
    throw new Error(`Sign in failed: ${authError.message}`)
  }
  
  if (!authData.user || !authData.session) {
    throw new Error('Sign in failed: No session returned')
  }
  
  return {
    userId: authData.user.id,
    email: authData.user.email!,
    accessToken: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
  }
}

/**
 * ユーザーのロール一覧を取得
 */
export async function getUserRoles(
  c: AppContext,
  userId: string
): Promise<RoleName[]> {
  const supabase = createSupabaseClient(c)
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles!inner(name)
    `)
    .eq('user_id', userId)
  
  if (error) {
    console.error('[getUserRoles] Failed to fetch user roles:', error)
    return []
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  return data
    .map((item: any) => item.roles?.name)
    .filter((name): name is RoleName => !!name)
}
