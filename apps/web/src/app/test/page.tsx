'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react"
import { AuditionCard } from "@/components/features/audition"
import { supabase } from "@/lib/supabase"

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

  // Supabaseからユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      setUsersError(null)
      
      console.log('🔍 [Supabase] usersテーブルからデータを取得中...')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ [Supabase] エラー:', error)
        throw error
      }
      
      console.log('✅ [Supabase] 取得成功:', data)
      setUsers(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー'
      console.error('💥 [Supabase] データ取得失敗:', errorMessage)
      setUsersError(errorMessage)
    } finally {
      setUsersLoading(false)
    }
  }

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchUsers()
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
      const response = await fetch(url)
      
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
      const response = await fetch(url)
      
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
        body: requestBody
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
        🔍 Supabase データベース接続テスト
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        更新日時: 2025/10/01 19:25
      </p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-bold">🎯 テスト目的</AlertTitle>
        <AlertDescription className="text-sm">
          • Supabaseデータベースとの直接通信確認<br/>
          • usersテーブルからのデータ取得・表示<br/>
          • ブラウザの開発者ツール（F12）→ コンソールタブで詳細ログを確認できます
        </AlertDescription>
      </Alert>

      {/* Users Table Display */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 Users テーブル一覧</CardTitle>
              <CardDescription>Supabaseから直接取得したユーザーデータ</CardDescription>
            </div>
            <Button 
              onClick={fetchUsers}
              disabled={usersLoading}
              variant="outline"
              size="sm"
            >
              {usersLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  読込中...
                </>
              ) : (
                '🔄 再読込'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">データを取得中...</span>
            </div>
          ) : usersError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>
                {usersError}
                <br />
                <span className="text-xs mt-2 block">
                  環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。
                </span>
              </AlertDescription>
            </Alert>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>📭 usersテーブルにデータがありません</p>
              <p className="text-sm mt-2">下記のフォームから新規ユーザーを作成できます</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">ID</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">LINE ID</th>
                    <th className="text-left p-2 font-medium">表示名</th>
                    <th className="text-left p-2 font-medium">状態</th>
                    <th className="text-left p-2 font-medium">作成日時</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">{user.id.substring(0, 8)}...</td>
                      <td className="p-2">{user.email || '-'}</td>
                      <td className="p-2">{user.line_user_id || '-'}</td>
                      <td className="p-2">{user.display_name || '-'}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.is_active ? '✓ 有効' : '✗ 無効'}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                合計: {users.length} 件
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Health Check */}
        <Card>
          <CardHeader>
            <CardTitle>1. Health Check</CardTitle>
            <CardDescription>API基本動作確認</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testHealthCheck}
              disabled={loading}
              className="w-full"
            >
              {loading ? '実行中...' : 'Health Check'}
            </Button>
          </CardContent>
        </Card>

        {/* Get Users */}
        <Card>
          <CardHeader>
            <CardTitle>2. Get Users</CardTitle>
            <CardDescription>Supabaseからユーザー一覧取得</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGetUsers}
              disabled={loading}
              className="w-full"
            >
              {loading ? '実行中...' : 'ユーザー取得'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Create User */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>3. Create User</CardTitle>
          <CardDescription>新規ユーザー作成テスト</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={userForm.provider}
                onValueChange={(value) => setUserForm({...userForm, provider: value})}
              >
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <Input
                id="handle"
                value={userForm.handle}
                onChange={(e) => setUserForm({...userForm, handle: e.target.value})}
                placeholder="test@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(value) => setUserForm({...userForm, role: value})}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applicant">Applicant</SelectItem>
                  <SelectItem value="fan">Fan</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={testCreateUser}
            disabled={loading || !userForm.handle}
            className="w-full"
          >
            {loading ? '実行中...' : 'ユーザー作成'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>成功</AlertTitle>
                <AlertDescription>操作が正常に完了しました</AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>エラーが発生しました</AlertDescription>
              </>
            )}
          </Alert>

          {/* Request Details */}
          {result.requestDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">📤 リクエスト詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">URL:</p>
                  <p className="text-sm text-muted-foreground break-all">{result.requestDetails.url}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Method:</p>
                  <p className="text-sm text-muted-foreground">{result.requestDetails.method}</p>
                </div>
                {result.requestDetails.headers && (
                  <div>
                    <p className="text-sm font-medium mb-1">Headers:</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(result.requestDetails.headers, null, 2)}
                    </pre>
                  </div>
                )}
                {result.requestDetails.body && (
                  <div>
                    <p className="text-sm font-medium mb-1">Body:</p>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                      {result.requestDetails.body}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Response Details */}
          {result.responseDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="text-secondary">📡 レスポンス詳細</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  <p className="text-sm text-muted-foreground">
                    {result.responseDetails.status} {result.responseDetails.statusText}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">URL:</p>
                  <p className="text-sm text-muted-foreground break-all">{result.responseDetails.url}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Headers:</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-48">
                    {JSON.stringify(result.responseDetails.headers, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Data */}
          <Card>
            <CardHeader>
              <CardTitle>📄 レスポンスデータ ({result.type})</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className={`p-4 rounded-md text-sm overflow-auto max-h-96 ${
                result.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
              }`}>
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 テスト項目</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p>✅ Cloudflare Workers デプロイ完了</p>
            <p>✅ Supabase データベース接続</p>
            <p>🔄 API → Database 通信テスト</p>
            <p>🔄 CRUD操作テスト</p>
            <p>🔄 エラーハンドリング確認</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>🔗 API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm font-mono text-muted-foreground">
            <p>GET {API_BASE}/api/v1/health</p>
            <p>GET {API_BASE}/api/v1/users</p>
            <p>POST {API_BASE}/api/v1/users</p>
            <p>GET {API_BASE}/api/v1/users/:id</p>
          </div>
        </CardContent>
      </Card>

      {/* v0生成デザイン: オーディションカード */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">🎨 v0生成デザイン - オーディションカード</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AuditionCard
            audition={{
              id: "1",
              title: "2025年春季ドラマ主演オーディション",
              date: "2025年4月15日",
              recruitCount: 5,
              category: "ドラマ",
              deadline: "2025年3月31日"
            }}
          />
          <AuditionCard
            audition={{
              id: "2",
              title: "映画「未来への扉」エキストラ募集",
              date: "2025年5月20日",
              recruitCount: 50,
              category: "映画",
              deadline: "2025年4月30日"
            }}
          />
          <AuditionCard
            audition={{
              id: "3",
              title: "CMタレントオーディション2025",
              date: "2025年6月10日",
              recruitCount: 3,
              category: "CM",
              deadline: "2025年5月15日"
            }}
          />
        </div>
      </div>
    </div>
  )
}
