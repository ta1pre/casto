import type { Bindings } from '../types/bindings'

type Environment = 'development' | 'production'

type EnvironmentConfig = {
  primaryOrigin: string
  additionalOrigins: string[]
}

const DEFAULT_ENVIRONMENT: Environment = 'development'

const BASE_CONFIG: Record<Environment, EnvironmentConfig> = {
  development: {
    primaryOrigin: 'https://casto.sb2024.xyz',
    additionalOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000']
  },
  production: {
    primaryOrigin: 'https://casto.io',
    additionalOrigins: []
  }
}

const ENV_KEYS: Environment[] = ['development', 'production']

const runtimeProcessEnv =
  typeof process !== 'undefined' && typeof process.env !== 'undefined'
    ? process.env
    : undefined

function normalize(value?: string | null): string | undefined {
  if (!value) {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function getEnvironment(env?: Bindings): Environment {
  const raw = normalize(env?.ENVIRONMENT ?? runtimeProcessEnv?.ENVIRONMENT)
  if (!raw) {
    return DEFAULT_ENVIRONMENT
  }
  const lower = raw.toLowerCase()
  if (ENV_KEYS.includes(lower as Environment)) {
    return lower as Environment
  }
  return DEFAULT_ENVIRONMENT
}

export function getPrimaryOrigin(env?: Bindings): string {
  const environment = getEnvironment(env)
  return BASE_CONFIG[environment].primaryOrigin
}

function parseAdditionalOrigins(env?: Bindings): string[] {
  const raw = normalize(env?.ALLOWED_ORIGINS ?? runtimeProcessEnv?.ALLOWED_ORIGINS)
  if (!raw) {
    return []
  }
  return raw
    .split(',')
    .map((value) => normalize(value))
    .filter((value): value is string => Boolean(value))
}

export function getAllowedOrigins(env?: Bindings): Set<string> {
  const environment = getEnvironment(env)
  const { primaryOrigin, additionalOrigins } = BASE_CONFIG[environment]
  const dynamicOrigins = parseAdditionalOrigins(env)
  return new Set<string>([primaryOrigin, ...additionalOrigins, ...dynamicOrigins])
}
