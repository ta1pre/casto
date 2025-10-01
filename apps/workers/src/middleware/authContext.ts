import type { Next } from 'hono'
import { getAuthCookie, verifyJWT } from '../lib/auth'
import type { AppContext, AppBindings } from '../types'

export async function attachUserContext(c: AppContext, next: Next) {
  const token = getAuthCookie(c)

  if (!token) {
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

    if (!payload.sub) {
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
  } catch {
    // ignore verification error and continue without user context
  }

  await next()
}
