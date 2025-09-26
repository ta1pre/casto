import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'

export const AUTH_COOKIE_NAME = 'casto_auth'
const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 // 24時間

type ProviderType = 'line' | 'email'

export type TokenPayloadInput = {
  userId: string
  roles: string[]
  provider: ProviderType
  tokenVersion: number
}

export type VerifiedTokenPayload = JWTPayload & {
  roles?: string[] | string
  provider?: ProviderType
  tokenVersion?: number
}

const encoder = new TextEncoder()

const getSecretKey = (secret: string) => encoder.encode(secret)

export async function createJWT(
  payload: TokenPayloadInput,
  secret: string,
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS
): Promise<string> {
  const secretKey = getSecretKey(secret)

  return new SignJWT({
    roles: payload.roles,
    provider: payload.provider,
    tokenVersion: payload.tokenVersion
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secretKey)
}

export async function verifyJWT(token: string, secret: string): Promise<VerifiedTokenPayload> {
  const secretKey = getSecretKey(secret)
  const { payload } = await jwtVerify(token, secretKey)
  return payload as VerifiedTokenPayload
}

export function setAuthCookie(
  c: Context,
  token: string,
  maxAgeSeconds = DEFAULT_EXPIRY_SECONDS
) {
  const environment = c.env?.ENVIRONMENT ?? 'development'
  const isSecure = environment !== 'development'

  setCookie(c, AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: maxAgeSeconds
  })
}

export function getAuthCookie(c: Context): string | undefined {
  return getCookie(c, AUTH_COOKIE_NAME)
}

export function clearAuthCookie(c: Context) {
  deleteCookie(c, AUTH_COOKIE_NAME, { path: '/' })
}
