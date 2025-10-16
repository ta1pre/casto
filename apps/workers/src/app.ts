import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { attachUserContext } from './middleware/authContext'
import healthRoutes from './features/health/routes'
import usersRoutes from './features/users/routes'
import authRoutes from './features/auth/routes'
import profileRoutes from './features/liff/profile/routes'
import photosRoutes from './features/liff/profile/photos.routes'
import adminAuthRoutes from './features/admin/auth/routes'
import organizerAuthRoutes from './features/organizer/auth/routes'
import organizerProfileRoutes from './features/organizer/profile/routes'
import organizerAuditionRoutes from './features/organizer/auditions/routes'
import organizerGenreRoutes from './features/organizer/auditions/genres.routes'
import organizerMainVisualRoutes from './features/organizer/auditions/mainVisual.routes'
import organizerAreaRoutes from './features/organizer/areas/routes'
import organizerApplicationRoutes from './features/organizer/applications/routes'
import talentAuditionRoutes from './features/talent/auditions/routes'
import talentApplicationRoutes from './features/talent/applications/routes'
import talentGenreRoutes from './features/talent/genres/routes'
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
  app.route('/api/v1/liff/profile/photos', photosRoutes)
  app.route('/api/v1/admin', adminAuthRoutes)
  app.route('/api/v1/organizer', organizerAuthRoutes)
  app.route('/api/v1/organizer', organizerProfileRoutes)
  app.route('/api/v1/organizer/auditions', organizerAuditionRoutes)
  app.route('/api/v1/organizer/auditions', organizerMainVisualRoutes)
  app.route('/api/v1/organizer/genres', organizerGenreRoutes)
  app.route('/api/v1/organizer/areas', organizerAreaRoutes)
  app.route('/api/v1/organizer', organizerApplicationRoutes)
  app.route('/api/v1/talent/auditions', talentAuditionRoutes)
  app.route('/api/v1/talent/applications', talentApplicationRoutes)
  app.route('/api/v1/talent/genres', talentGenreRoutes)

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
