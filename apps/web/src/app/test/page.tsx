'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { UsersTable } from './_components/UsersTable'
import { ApiTestCards } from './_components/ApiTestCards'
import { UserCreateForm } from './_components/UserCreateForm'
import { TestResultDisplay } from './_components/TestResultDisplay'

export const dynamic = 'force-dynamic'

interface User {
  id: string
  email: string | null
  line_user_id: string | null
  display_name: string | null
  is_active: boolean
  token_version: number
  created_at: string
  updated_at: string
}

interface ApiResponse {
  status?: string
  timestamp?: string
  environment?: string
  error?: string
}

interface TestResult {
  success: boolean
  data?: ApiResponse
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

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [userForm, setUserForm] = useState({
    provider: 'email',
    handle: '',
    role: 'applicant'
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  // Workers API経由でユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      setUsersError(null)
      
      if (!API_BASE) {
        throw new Error('APIベースURLが設定されていません')
      }
      
      const url = `${API_BASE}/api/v1/users`
      console.log('🔍 [API] users一覧を取得中...', url)

      const response = await fetch(url, {
        credentials: 'include'
      })

      const payload = await response.json()

      if (!response.ok) {
        console.error('❌ [API] レスポンスエラー:', response.status, payload)
        const message = typeof payload?.error === 'string' ? payload.error : 'APIエラーが発生しました'
        throw new Error(message)
      }

      const usersData = Array.isArray(payload?.users) ? payload.users : []

      console.log('✅ [API] 取得成功:', usersData)
      setUsers(usersData as User[])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      console.error('💥 [API] データ取得失敗:', errorMessage)
      setUsersError(errorMessage)
    } finally {
      setUsersLoading(false)
    }
  }

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!API_BASE) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>
            APIベースURLが設定されていません。環境変数 NEXT_PUBLIC_API_BASE_URL を確認してください。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const testHealthCheck = async () => {
    setLoading(true)
    const url = `${API_BASE}/api/v1/health`
    
    console.log('🚀 [Health Check] リクエスト開始:', url)
    
    try {
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      console.log('📡 [Health Check] レスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        url: response.url
      })
      
      const data = await response.json()
      console.log('📄 [Health Check] レスポンスデータ:', data)
      
      const result = {
        success: response.ok,
        data,
        type: 'health',
        requestDetails: {
          url,
          method: 'GET'
        },
        responseDetails: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url
        }
      }
      
      if (!response.ok) {
        console.error('❌ [Health Check] HTTPエラー:', response.status, response.statusText)
      } else {
        console.log('✅ [Health Check] 成功!')
      }
      
      setResult(result)
    } catch (error) {
      console.error('💥 [Health Check] ネットワークエラー:', error)
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        type: 'health',
        requestDetails: {
          url,
          method: 'GET'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const testGetUsers = async () => {
    setLoading(true)
    const url = `${API_BASE}/api/v1/users`
    
    console.log('🚀 [Get Users] リクエスト開始:', url)
    
    try {
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      console.log('📡 [Get Users] レスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        url: response.url
      })
      
      const data = await response.json()
      console.log('📄 [Get Users] レスポンスデータ:', data)
      
      const result = {
        success: response.ok,
        data,
        type: 'users',
        requestDetails: {
          url,
          method: 'GET'
        },
        responseDetails: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url
        }
      }
      
      if (!response.ok) {
        console.error('❌ [Get Users] HTTPエラー:', response.status, response.statusText)
        console.error('❌ [Get Users] エラーデータ:', data)
      } else {
        console.log('✅ [Get Users] 成功!')
      }
      
      setResult(result)
    } catch (error) {
      console.error('💥 [Get Users] ネットワークエラー:', error)
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        type: 'users',
        requestDetails: {
          url,
          method: 'GET'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const testCreateUser = async () => {
    if (!userForm.handle) {
      setResult({ success: false, error: 'Handle is required', type: 'create' })
      return
    }

    setLoading(true)
    const url = `${API_BASE}/api/v1/users`
    const requestBody = JSON.stringify(userForm)
    const requestHeaders = {
      'Content-Type': 'application/json',
    }
    
    console.log('🚀 [Create User] リクエスト開始:', url)
    console.log('📤 [Create User] リクエストボディ:', userForm)
    console.log('📤 [Create User] リクエストヘッダー:', requestHeaders)
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
        credentials: 'include'
      })
      
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
      
      console.log('📡 [Create User] レスポンス受信:', {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        url: response.url
      })
      
      const data = await response.json()
      console.log('📄 [Create User] レスポンスデータ:', data)
      
      const result = {
        success: response.ok,
        data,
        type: 'create',
        requestDetails: {
          url,
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        },
        responseDetails: {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          url: response.url
        }
      }
      
      if (!response.ok) {
        console.error('❌ [Create User] HTTPエラー:', response.status, response.statusText)
        console.error('❌ [Create User] エラーデータ:', data)
      } else {
        console.log('✅ [Create User] 成功!')
      }
      
      setResult(result)
    } catch (error) {
      console.error('💥 [Create User] ネットワークエラー:', error)
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error', 
        type: 'create',
        requestDetails: {
          url,
          method: 'POST',
          headers: requestHeaders,
          body: requestBody
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-2">
        🔍 Workers API 接続テスト
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        更新日時: 2025/10/01
      </p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">🎯 テスト目的</AlertTitle>
        <AlertDescription className="text-sm">
          • Workers API経由でのデータ取得・表示<br/>
          • usersテーブルのCRUD操作確認<br/>
          • ブラウザの開発者ツール（F12）→ コンソールタブで詳細ログを確認できます
        </AlertDescription>
      </Alert>

      <UsersTable 
        users={users}
        loading={usersLoading}
        error={usersError}
        onRefresh={fetchUsers}
      />
      
      <ApiTestCards
        loading={loading}
        onHealthCheck={testHealthCheck}
        onGetUsers={testGetUsers}
      />

      <UserCreateForm
        formData={userForm}
        loading={loading}
        onFormChange={setUserForm}
        onSubmit={testCreateUser}
      />

      <TestResultDisplay result={result} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔗 API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm font-mono text-muted-foreground">
            <p>GET {API_BASE}/api/v1/health</p>
            <p>GET {API_BASE}/api/v1/users</p>
            <p>POST {API_BASE}/api/v1/users</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
