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

export const resolveApiUrl = (path: string) => {
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
    url: resolveApiUrl(path),
    method: options.method || 'GET',
    headers: finalHeaders,
    hasBody: !!options.body
  })

  const response = await fetch(resolveApiUrl(path), {
    ...rest,
    credentials,
    headers: finalHeaders
  })

  if (!parseJson) {
    return response as unknown as T
  }

  let body: unknown = null
  let bodyText = ''
  
  try {
    bodyText = await response.text()
    if (bodyText) {
      body = JSON.parse(bodyText)
    }
  } catch (e) {
    console.error('[API] Failed to parse response body:', e)
    body = { _raw: bodyText }
  }

  if (!response.ok) {
    const url = resolveApiUrl(path)
    const errorDetails = {
      url,
      method: options.method || 'GET',
      status: response.status,
      statusText: response.statusText,
      body,
      bodyText,
      headers: Object.fromEntries(response.headers.entries()),
      requestHeaders: finalHeaders,
      timestamp: new Date().toISOString()
    }
    console.error('[API Error]', errorDetails)
    
    // エラーを画面に強制表示（デバッグ用）
    if (typeof window !== 'undefined') {
      const errorDiv = document.createElement('div')
      errorDiv.id = 'api-error-banner-' + Date.now()
      errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc2626;color:white;padding:12px;z-index:9999;font-size:13px;line-height:1.5;box-shadow:0 4px 6px rgba(0,0,0,0.3);'
      
      const errorJson = JSON.stringify(errorDetails, null, 2)
      errorDiv.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;">
          <strong style="font-size:15px;">🔴 API Error (${response.status} ${response.statusText})</strong><br>
          <span style="font-size:11px;opacity:0.9;">URL: ${url}</span><br>
          <span style="font-size:11px;opacity:0.9;">Method: ${errorDetails.method}</span><br>
          <div style="margin-top:8px;">
            <button id="${errorDiv.id}-copy" style="background:#991b1b;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;margin-right:8px;">📋 Copy Error Details</button>
            <button id="${errorDiv.id}-close" style="background:#991b1b;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:12px;">✕ Close</button>
          </div>
        </div>
      `
      document.body.appendChild(errorDiv)
      
      // コピーボタン
      document.getElementById(errorDiv.id + '-copy')?.addEventListener('click', () => {
        navigator.clipboard.writeText(errorJson).then(() => {
          alert('エラー詳細をコピーしました！\n\n' + errorJson.substring(0, 200) + '...')
        })
      })
      
      // 閉じるボタン
      document.getElementById(errorDiv.id + '-close')?.addEventListener('click', () => {
        errorDiv.remove()
      })
    }
    
    throw new ApiError('API request failed', response.status, response.statusText, body, url)
  }

  return body as T
}
