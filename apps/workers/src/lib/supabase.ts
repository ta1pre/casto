import { createClient } from '@supabase/supabase-js'
import type { AppContext } from '../types'

export function createSupabaseClient(c: AppContext) {
  const supabaseUrl = c.env?.SUPABASE_URL
  const supabaseKey = c.env?.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}
