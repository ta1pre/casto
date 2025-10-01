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
