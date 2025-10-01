export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const getApiBaseUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!base) {
    return ''
  }
  return base.replace(/\/$/, '')
}

const buildUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  const base = getApiBaseUrl()
  if (!base) {
    return path
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

interface ApiFetchOptions extends RequestInit {
  parseJson?: boolean
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    headers,
    parseJson = true,
    credentials = 'include',
    ...rest
  } = options

  const response = await fetch(buildUrl(path), {
    ...rest,
    credentials,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })

  if (!parseJson) {
    return response as unknown as T
  }

  const body = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new ApiError('API request failed', response.status, body)
  }

  return body as T
}
