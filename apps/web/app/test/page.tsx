'use client'

import { useState } from 'react'
import { Box, Button, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material'

interface ApiResponse {
  status?: string
  timestamp?: string
  environment?: string
  error?: string
}

export default function TestPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Production API URL
      const apiUrl = 'https://casto-workers.casto-api.workers.dev/api/v1/health'
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🧪 API接続テスト
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cloudflare Workers API Health Check
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Production API: https://casto-workers.casto-api.workers.dev/api/v1/health
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={testApi}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'テスト中...' : 'APIテスト実行'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">❌ エラー</Typography>
          <Typography>{error}</Typography>
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6">✅ API接続成功！</Typography>
          <Box component="pre" sx={{ mt: 1, fontSize: '0.875rem' }}>
            {JSON.stringify(result, null, 2)}
          </Box>
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 テスト項目
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>✅ Cloudflare Workers デプロイ完了</li>
            <li>✅ API エンドポイント動作確認</li>
            <li>🔄 フロントエンド → API 通信テスト</li>
            <li>⏳ CORS設定確認</li>
            <li>⏳ 環境変数設定</li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
