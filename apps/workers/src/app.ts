import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { attachUserContext } from './middleware/authContext'
import healthRoutes from './features/health/routes'
import usersRoutes from './features/users/routes'
import authRoutes from './features/auth/routes'
import profileRoutes from './features/liff/profile/routes'
import { getAllowedOrigins, getPrimaryOrigin } from './config/env'
import type { AppBindings } from './types'

export function createApp() {
  const app = new Hono<AppBindings>()

  app.use('*', async (c, next) => {
    const primaryOrigin = getPrimaryOrigin(c.env)
    const allowedOrigins = getAllowedOrigins(c.env)

    const corsMiddleware = cors({
      origin: (origin) => {
        if (!origin) {
          return primaryOrigin
        }
        if (allowedOrigins.has(origin)) {
          return origin
        }
        return primaryOrigin
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    })

    return corsMiddleware(c, next)
  })

  app.use('*', attachUserContext)

  app.route('/api/v1', healthRoutes)
  app.route('/api/v1', authRoutes)
  app.route('/api/v1', usersRoutes)
  app.route('/api/v1/liff/profile', profileRoutes)

  app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404)
  })

  app.onError((err, c) => {
    console.error('Error:', err)
    return c.json({ error: 'Internal Server Error' }, 500)
  })

  return app
}

const app = createApp()

export default app
