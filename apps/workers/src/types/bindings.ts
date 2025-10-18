import type { Context } from 'hono'

export type Bindings = {
  JWT_SECRET?: string
  DATABASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  LINE_CHANNEL_SECRET?: string
  LINE_CHANNEL_ID?: string
  LINE_MINI_APP_CHANNEL_ID?: string
  LINE_MINI_APP_CHANNEL_SECRET?: string
  LIFF_ID?: string
  STRIPE_SECRET_KEY?: string
  ENVIRONMENT?: string
  ALLOWED_ORIGINS?: string
  WEB_URL?: string
  AWS_SES_REGION?: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  FROM_EMAIL?: string
  CACHE?: KVNamespace
  NOTIFICATION_QUEUE?: Queue
  TALENT_PHOTOS?: R2Bucket
}

export type AppBindings = {
  Bindings: Bindings
  Variables: {
    user?: {
      id: string
      roles: string[]
      provider?: string
      tokenVersion?: number
    }
  }
}

export type AppContext = Context<AppBindings>
