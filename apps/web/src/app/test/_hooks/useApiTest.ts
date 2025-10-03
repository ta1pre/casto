import { useState } from 'react'

interface TestResult {
  success: boolean
  data?: unknown
  error?: string
  type: string
  requestDetails?: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
  }
  responseDetails?: {
    status: number
    statusText: string
    headers: Record<string, string>
    url: string
  }
}

export function useApiTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const executeApiCall = async (
    url: string,
    method: 'GET' | 'POST',
    type: string,
    body?: unknown
  ): Promise<boolean> => {
    setLoading(true)

    const requestHeaders: Record<string, string> = {}
    const shouldSendBody = body !== undefined
    const requestBody = shouldSendBody ? JSON.stringify(body) : undefined

    if (shouldSendBody) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    console.log(`🚀 [${type}] リクエスト開始:`, url)
    if (body) {
      console.log(`📤 [${type}] リクエストボディ:`, body)
      console.log(`📤 [${type}] リクエストヘッダー:`, requestHeaders)
    }

    try {
      const response = await fetch(url, {
        method,
        headers: Object.keys(requestHeaders).length > 0 ? requestHeaders : undefined,
        body: requestBody,
        credentials: 'include'
      })

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      console.log(`📡 [${type}] レスポンス受信:`, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        url: response.url
      })

      const data = await response.json()
      console.log(`📄 [${type}] レスポンスデータ:`, data)

      const result: TestResult = {
        success: response.ok,
        data,
        type,
        requestDetails: {
          url,
          method,
          ...(Object.keys(requestHeaders).length > 0 && { headers: requestHeaders }),
          ...(requestBody && { body: requestBody })
        },
        responseDetails: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url
        }
      }

      if (!response.ok) {
        console.error(`❌ [${type}] HTTPエラー:`, response.status, response.statusText)
        console.error(`❌ [${type}] エラーデータ:`, data)
      } else {
        console.log(`✅ [${type}] 成功!`)
      }

      setResult(result)
      return result.success
    } catch (error) {
      console.error(`💥 [${type}] ネットワークエラー:`, error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        type,
        requestDetails: {
          url,
          method,
          ...(Object.keys(requestHeaders).length > 0 && { headers: requestHeaders }),
          ...(requestBody && { body: requestBody })
        }
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
  }

  return {
    loading,
    result,
    executeApiCall,
    reset
  }
}
