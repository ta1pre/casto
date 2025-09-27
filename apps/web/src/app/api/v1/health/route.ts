export async function GET() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')

  if (!API_BASE_URL) {
    return new Response('API base URL not configured', { status: 500 })
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return new Response('Health check failed', { status: response.status })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Health check proxy error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
