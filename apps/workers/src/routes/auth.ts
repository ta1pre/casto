import { Hono } from 'hono'
import { createSupabaseClient } from '../lib/supabase'
import {
  clearAuthCookie,
  createJWT,
  getAuthCookie,
  setAuthCookie,
  verifyJWT
} from '../lib/auth'
import {
  findUserByEmail,
  findUserById,
  mapRoles,
  serializeUserResponse,
  upsertEmailUser,
  upsertLineUser
} from '../lib/users'
import type { TokenPayloadInput } from '../lib/auth'
import type { AppBindings, SupabaseUserRow } from '../types'

const authRoutes = new Hono<AppBindings>()

async function issueSession(c: any, user: SupabaseUserRow) {
  const jwtSecret = c.env?.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }

  const payload: TokenPayloadInput = {
    userId: user.id,
    roles: mapRoles(user.role),
    provider: (user.auth_provider as 'line' | 'email') ?? 'line',
    tokenVersion: user.token_version ?? 0
  }

  const token = await createJWT(payload, jwtSecret)
  setAuthCookie(c, token)
  return token
}

async function verifyLineIdToken(idToken: string, channelId: string) {
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: channelId
  })

  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LINE verify failed: ${response.status} ${errorText}`)
  }

  return response.json() as Promise<{
    sub: string
    name?: string
    email?: string
    picture?: string
  }>
}

authRoutes.post('/auth/line/verify', async (c) => {
  try {
    const body = await c.req.json<{ idToken?: string }>()
    const idToken = body?.idToken

    if (!idToken) {
      return c.json({ error: 'idToken is required' }, 400)
    }

    const channelId = c.env?.LINE_CHANNEL_ID
    if (!channelId) {
      return c.json({ error: 'LINE channel configuration missing' }, 500)
    }

    const tokenInfo = await verifyLineIdToken(idToken, channelId)
    const supabase = createSupabaseClient(c)
    const user = await upsertLineUser(supabase, tokenInfo.sub, {
      name: tokenInfo.name,
      email: tokenInfo.email ?? null,
      picture: tokenInfo.picture
    })

    await issueSession(c, user)

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    return c.json({ error: 'LINE authentication failed' }, 401)
  }
})

authRoutes.post('/auth/email/request', async (c) => {
  try {
    const body = await c.req.json<{ email?: string; role?: string; redirectUrl?: string }>()
    const email = body?.email?.trim()

    if (!email) {
      return c.json({ error: 'email is required' }, 400)
    }

    const token = crypto.randomUUID()
    const kv = c.env?.CACHE
    if (!kv) {
      return c.json({ error: 'CACHE KV namespace is not configured' }, 500)
    }

    const key = `magic_link:${token}`
    await kv.put(key, JSON.stringify({ email, role: body?.role }), { expirationTtl: 60 * 10 })

    const redirectUrl = body?.redirectUrl
    const magicLinkUrl = redirectUrl ? `${redirectUrl}?token=${token}` : undefined

    return c.json({
      ok: true,
      token,
      magicLinkUrl
    })
  } catch (error) {
    return c.json({ error: 'Failed to create magic link' }, 500)
  }
})

authRoutes.post('/auth/email/verify', async (c) => {
  try {
    const body = await c.req.json<{ token?: string }>()
    const token = body?.token

    if (!token) {
      return c.json({ error: 'token is required' }, 400)
    }

    const kv = c.env?.CACHE
    if (!kv) {
      return c.json({ error: 'CACHE KV namespace is not configured' }, 500)
    }

    const key = `magic_link:${token}`
    const stored = await kv.get(key)

    if (!stored) {
      return c.json({ error: 'Invalid or expired token' }, 400)
    }

    await kv.delete(key)

    const payload = JSON.parse(stored) as { email: string; role?: string }
    const supabase = createSupabaseClient(c)
    const user = await upsertEmailUser(supabase, payload.email, {
      role: payload.role ?? 'organizer'
    })

    await issueSession(c, user)

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    return c.json({ error: 'Failed to verify magic link' }, 500)
  }
})

authRoutes.post('/auth/logout', (c) => {
  clearAuthCookie(c)
  return c.json({ ok: true })
})

authRoutes.get('/auth/session', async (c) => {
  try {
    const token = getAuthCookie(c)
    if (!token) {
      return c.json({ user: null }, 401)
    }

    const jwtSecret = c.env?.JWT_SECRET
    if (!jwtSecret) {
      return c.json({ error: 'JWT_SECRET is not configured' }, 500)
    }

    const payload = await verifyJWT(token, jwtSecret)
    if (!payload.sub) {
      return c.json({ user: null }, 401)
    }

    const supabase = createSupabaseClient(c)
    const user = await findUserById(supabase, payload.sub)

    if (!user) {
      return c.json({ user: null }, 404)
    }

    return c.json({
      user: serializeUserResponse(user)
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch session' }, 500)
  }
})

export default authRoutes
