/**
 * ロールベース認証ミドルウェア
 * 
 * [SFT][REH] 特定のロールを持つユーザーのみアクセス可能にする
 */

import type { Next } from 'hono'
import type { AppContext } from '../types'
import type { RoleName } from '@casto/shared'
import { createSupabaseClient } from '../lib/supabase'

/**
 * ユーザーのロールを取得
 */
async function getUserRoles(c: AppContext, userId: string): Promise<RoleName[]> {
  const supabase = createSupabaseClient(c)
  
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles!inner(name)
    `)
    .eq('user_id', userId)
  
  if (error) {
    console.error('[verifyRoleAuth] Failed to fetch user roles:', error)
    return []
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // データ構造を確認してロール名を抽出
  return data
    .map((item: any) => item.roles?.name)
    .filter((name): name is RoleName => !!name)
}

/**
 * 管理者認証ミドルウェア
 * 
 * userContextが存在し、かつroleが'admin'であることを確認
 */
export async function verifyAdminAuth(c: AppContext, next: Next) {
  const userContext = c.get('user')

  if (!userContext) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401)
  }

  // DBから最新のロール情報を取得
  const roles = await getUserRoles(c, userContext.id)
  
  if (!roles.includes('admin')) {
    return c.json({ error: 'Forbidden: Admin role required' }, 403)
  }

  await next()
}

/**
 * 主催者認証ミドルウェア
 * 
 * userContextが存在し、かつroleが'organizer'であることを確認
 */
export async function verifyOrganizerAuth(c: AppContext, next: Next) {
  const userContext = c.get('user')

  if (!userContext) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401)
  }

  // DBから最新のロール情報を取得
  const roles = await getUserRoles(c, userContext.id)
  
  if (!roles.includes('organizer')) {
    return c.json({ error: 'Forbidden: Organizer role required' }, 403)
  }

  await next()
}

/**
 * 汎用ロール認証ミドルウェア
 * 
 * 指定されたロールのいずれかを持つユーザーのみアクセス可能
 */
export function verifyAnyRole(allowedRoles: RoleName[]) {
  return async (c: AppContext, next: Next) => {
    const userContext = c.get('user')

    if (!userContext) {
      return c.json({ error: 'Unauthorized: Authentication required' }, 401)
    }

    // DBから最新のロール情報を取得
    const roles = await getUserRoles(c, userContext.id)
    
    const hasRequiredRole = allowedRoles.some(role => roles.includes(role))
    
    if (!hasRequiredRole) {
      return c.json({ 
        error: `Forbidden: One of the following roles required: ${allowedRoles.join(', ')}` 
      }, 403)
    }

    await next()
  }
}
