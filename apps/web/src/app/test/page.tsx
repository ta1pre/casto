'use client'

import { useState } from 'react'
import { Button, Card, CardContent, Typography, Box, Alert, TextField, MenuItem } from '@mui/material'
import Grid from '@mui/material/Grid'

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
  const [userForm, setUserForm] = useState({
    provider: 'email',
    handle: '',
    role: 'applicant'
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

  if (!API_BASE) {
    return <Alert severity="error">AAPIベースURLが設定されていません。環境変数 NEXT_PUBLIC_API_BASE_URL を確認してください。</Alert>
  }

  const testHealthCheck = async () => {
    setLoading(true)
    const url = `${API_BASE}/api/v1/health`
    
    console.log('🚀 [Health Check] リクエスト開始:', url)
    
    try {
      const response = await fetch(url)
      
      // レスポンスヘッダーを取得
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
      
      // レスポンスヘッダーを取得
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
      
      // レスポンスヘッダーを取得
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
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🔍 詳細ログ付き接続テスト (更新日時: 2025/09/23 16:20)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🚀 デバッグモード有効！</strong><br/>
          • ブラウザの開発者ツール（F12）→ コンソールタブで詳細ログを確認できます<br/>
          • リクエスト/レスポンスの詳細情報が画面とコンソールの両方に出力されます<br/>
          • データベース接続エラーの原因を特定するための情報が含まれています
        </Typography>
      </Alert>
      
      <Grid container spacing={3}>
        {/* Health Check */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                1. Health Check
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                API基本動作確認だ
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={testHealthCheck}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? '実行中...' : 'Health Check'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Get Users */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                2. Get Users
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Supabaseからユーザー一覧取得
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={testGetUsers}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? '実行中...' : 'ユーザー取得'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Create User */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3. Create User
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                新規ユーザー作成テスト
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Provider"
                    value={userForm.provider}
                    onChange={(e) => setUserForm({...userForm, provider: e.target.value})}
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="line">LINE</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Handle"
                    value={userForm.handle}
                    onChange={(e) => setUserForm({...userForm, handle: e.target.value})}
                    placeholder="test@example.com"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Role"
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  >
                    <MenuItem value="applicant">Applicant</MenuItem>
                    <MenuItem value="fan">Fan</MenuItem>
                    <MenuItem value="organizer">Organizer</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              
              <Button 
                variant="contained" 
                onClick={testCreateUser}
                disabled={loading || !userForm.handle}
                sx={{ mt: 2 }}
              >
                {loading ? '実行中...' : 'ユーザー作成'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results */}
      {result && (
        <Box sx={{ mt: 3 }}>
          <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
            {result.success ? '✅ 成功！' : '❌ エラー'}
          </Alert>

          {/* Request Details */}
          {result.requestDetails && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  📤 リクエスト詳細
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>URL:</strong> {result.requestDetails.url}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Method:</strong> {result.requestDetails.method}
                </Typography>
                {result.requestDetails.headers && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Headers:</strong>
                    </Typography>
                    <pre style={{ 
                      background: '#e3f2fd', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      margin: 0
                    }}>
                      {JSON.stringify(result.requestDetails.headers, null, 2)}
                    </pre>
                  </Box>
                )}
                {result.requestDetails.body && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Body:</strong>
                    </Typography>
                    <pre style={{ 
                      background: '#e3f2fd', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      margin: 0
                    }}>
                      {result.requestDetails.body}
                    </pre>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Response Details */}
          {result.responseDetails && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  📡 レスポンス詳細
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Status:</strong> {result.responseDetails.status} {result.responseDetails.statusText}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>URL:</strong> {result.responseDetails.url}
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Headers:</strong>
                  </Typography>
                  <pre style={{ 
                    background: '#fff3e0', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    margin: 0,
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(result.responseDetails.headers, null, 2)}
                  </pre>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Response Data */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📄 レスポンスデータ ({result.type})
              </Typography>
              <pre style={{ 
                background: result.success ? '#e8f5e8' : '#ffebee', 
                padding: '16px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
                maxHeight: '400px'
              }}>
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Status */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 テスト項目
          </Typography>
          <Typography component="div">
            ✅ Cloudflare Workers デプロイ完了<br/>
            ✅ Supabase データベース接続<br/>
            🔄 API → Database 通信テスト<br/>
            🔄 CRUD操作テスト<br/>
            🔄 エラーハンドリング確認
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔗 API Endpoints
          </Typography>
          <Typography component="div" sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
            GET {API_BASE}/api/v1/health<br/>
            GET {API_BASE}/api/v1/users<br/>
            POST {API_BASE}/api/v1/users<br/>
            GET {API_BASE}/api/v1/users/:id
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
