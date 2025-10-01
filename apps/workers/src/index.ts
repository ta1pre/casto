import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { attachUserContext } from './middleware/authContext'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import meRoutes from './routes/me'
import auditionsRoutes from './routes/auditions'
import type { AppBindings } from './types'

const app = new Hono<AppBindings>()

const DEFAULT_ALLOWED_ORIGIN = 'https://casto.sb2024.xyz'
const ADDITIONAL_ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  DEFAULT_ALLOWED_ORIGIN
])

app.use('*', cors({
  origin: (origin: string | undefined) => {
    if (!origin) {
      return DEFAULT_ALLOWED_ORIGIN
    }
    if (ADDITIONAL_ALLOWED_ORIGINS.has(origin)) {
      return origin
    }
    return DEFAULT_ALLOWED_ORIGIN
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.use('*', attachUserContext)

app.route('/api/v1', healthRoutes)
app.route('/api/v1', authRoutes)
app.route('/api/v1', usersRoutes)
app.route('/api/v1', meRoutes)
app.route('/api/v1', auditionsRoutes)

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
