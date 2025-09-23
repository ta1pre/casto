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
}

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [userForm, setUserForm] = useState({
    provider: 'email',
    handle: '',
    role: 'applicant'
  })

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://casto-workers.casto-api.workers.dev'

  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/health`)
      const data = await response.json()
      setResult({ success: true, data, type: 'health' })
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error', type: 'health' })
    } finally {
      setLoading(false)
    }
  }

  const testGetUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/users`)
      const data = await response.json()
      setResult({ success: response.ok, data, type: 'users' })
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error', type: 'users' })
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
    try {
      const response = await fetch(`${API_BASE}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm)
      })
      const data = await response.json()
      setResult({ success: response.ok, data, type: 'create' })
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error', type: 'create' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 API + Database 接続テストだおおおお！
      </Typography>
      
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

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                結果 ({result.type})
              </Typography>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '16px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
                maxHeight: '400px'
              }}>
                {JSON.stringify(result, null, 2)}
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
