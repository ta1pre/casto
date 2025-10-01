import type { Context } from 'hono'

export type Bindings = {
  JWT_SECRET?: string
  DATABASE_URL?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  LINE_CHANNEL_SECRET?: string
  LINE_CHANNEL_ID?: string
  STRIPE_SECRET_KEY?: string
  ENVIRONMENT?: string
  CACHE?: KVNamespace
  NOTIFICATION_QUEUE?: Queue
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

export type SupabaseUserRow = {
  id: string
  email?: string | null
  line_user_id?: string | null
  display_name?: string | null
  role?: string | null
  auth_provider?: string | null
  token_version?: number | null
  is_active?: boolean | null
  created_at?: string
  updated_at?: string
}
