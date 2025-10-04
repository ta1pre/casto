import type { Next } from 'hono'
import { getAuthCookie, verifyJWT } from '../lib/auth'
import type { AppContext, AppBindings } from '../types'

export async function attachUserContext(c: AppContext, next: Next) {
  const token = getAuthCookie(c)
  
  console.log('[authContext] Cookie token present:', !!token)

  if (!token) {
    console.log('[authContext] No token found, continuing without user context')
    await next()
    return
  }

  const jwtSecret = c.env?.JWT_SECRET
  if (!jwtSecret) {
    await next()
    return
  }

  try {
    const payload = await verifyJWT(token, jwtSecret)
    console.log('[authContext] JWT verified, payload:', { sub: payload.sub, provider: payload.provider })

    if (!payload.sub) {
      console.log('[authContext] No sub in payload, continuing without user context')
      await next()
      return
    }

    const roles = Array.isArray(payload.roles)
      ? payload.roles
      : typeof payload.roles === 'string'
        ? [payload.roles]
        : []

    c.set('user', {
      id: payload.sub,
      roles,
      provider: payload.provider,
      tokenVersion: payload.tokenVersion
    })
    console.log('[authContext] User context set successfully')
  } catch (e) {
    console.error('[authContext] JWT verification failed:', e)
    // ignore verification error and continue without user context
  }

  await next()
}
