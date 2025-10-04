export class ApiError extends Error {
  status: number
  statusText: string
  body: unknown
  url: string

  constructor(message: string, status: number, statusText: string, body: unknown, url: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
    this.url = url
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

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }

  console.log('[API Request]', {
    url: buildUrl(path),
    method: options.method || 'GET',
    headers: finalHeaders,
    hasBody: !!options.body
  })

  const response = await fetch(buildUrl(path), {
    ...rest,
    credentials,
    headers: finalHeaders
  })

  if (!parseJson) {
    return response as unknown as T
  }

  const body = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const url = buildUrl(path)
    const errorDetails = {
      url,
      status: response.status,
      statusText: response.statusText,
      body,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    }
    console.error('[API Error]', errorDetails)
    
    // エラーを画面に強制表示（デバッグ用）
    if (typeof window !== 'undefined') {
      const errorDiv = document.createElement('div')
      errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:10px;z-index:9999;font-size:12px;'
      errorDiv.innerHTML = `
        <strong>API Error (status=${response.status})</strong><br>
        URL: ${url}<br>
        <button onclick="navigator.clipboard.writeText('${JSON.stringify(errorDetails).replace(/'/g, "\\'")}');alert('Copied!')">Copy Error</button>
      `
      document.body.appendChild(errorDiv)
    }
    
    throw new ApiError('API request failed', response.status, response.statusText, body, url)
  }

  return body as T
}
