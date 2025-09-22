import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  JWT_SECRET: string
  DATABASE_URL: string
  LINE_CHANNEL_SECRET: string
  STRIPE_SECRET_KEY: string
  CACHE: KVNamespace
  NOTIFICATION_QUEUE: Queue
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://casto.sb2024.xyz'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Health Check
app.get('/api/v1/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development'
  })
})

// 認証エンドポイント
app.post('/api/v1/auth/line/verify', async (c) => {
  // TODO: LINE IDトークン検証実装
  return c.json({ message: 'LINE auth endpoint - TODO' })
})

app.post('/api/v1/auth/email/request', async (c) => {
  // TODO: Magic Link送信実装
  return c.json({ message: 'Email auth request endpoint - TODO' })
})

app.post('/api/v1/auth/email/verify', async (c) => {
  // TODO: Magic Link検証実装
  return c.json({ message: 'Email auth verify endpoint - TODO' })
})

// オーディション関連
app.get('/api/v1/auditions/:id', async (c) => {
  const id = c.req.param('id')
  // TODO: オーディション情報取得実装
  return c.json({ message: `Audition ${id} - TODO` })
})

app.post('/api/v1/auditions/:id/entries', async (c) => {
  const id = c.req.param('id')
  // TODO: 応募作成実装
  return c.json({ message: `Entry for audition ${id} - TODO` })
})

// 主催者向け
app.get('/api/v1/organizer/auditions/:id/entries', async (c) => {
  const id = c.req.param('id')
  // TODO: 応募者一覧取得実装
  return c.json({ message: `Entries for audition ${id} - TODO` })
})

// ファイルアップロード
app.post('/api/v1/uploads/sign', async (c) => {
  // TODO: R2署名URL発行実装
  return c.json({ message: 'Upload sign endpoint - TODO' })
})

// Webhook
app.post('/api/v1/webhooks/line', async (c) => {
  // TODO: LINE Webhook処理実装
  return c.json({ message: 'LINE webhook - TODO' })
})

app.post('/api/v1/webhooks/stripe', async (c) => {
  // TODO: Stripe Webhook処理実装
  return c.json({ message: 'Stripe webhook - TODO' })
})

// 404ハンドラー
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// エラーハンドラー
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
