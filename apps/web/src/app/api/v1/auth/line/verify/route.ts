export async function POST(request: Request) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')

  if (!API_BASE_URL) {
    return new Response('API base URL not configured', { status: 500 })
  }

  try {
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/line/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      return new Response('LINE verification failed', { status: response.status })
    }

    const data = await response.json()
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/json')

    // Cookieを転送
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie)
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('LINE verify proxy error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
