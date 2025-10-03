/**
 * LINE認証ミドルウェア
 * 
 * [SFT][REH] LINE認証されたユーザーのみアクセス可能にする
 */

import type { Next } from 'hono'
import type { AppContext } from '../types'

/**
 * LINE認証チェックミドルウェア
 * 
 * userContextが存在し、かつproviderが'line'であることを確認
 */
export async function verifyLineToken(c: AppContext, next: Next) {
  const userContext = c.get('user')

  if (!userContext) {
    return c.json({ error: 'Unauthorized: Authentication required' }, 401)
  }

  if (userContext.provider !== 'line') {
    return c.json({ error: 'Forbidden: LINE authentication required' }, 403)
  }

  await next()
}
