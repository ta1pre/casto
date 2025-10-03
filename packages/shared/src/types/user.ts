export type AuthProvider = 'email' | 'line'

export type UserRole =
  | 'applicant'
  | 'fan'
  | 'organizer'
  | 'manager'
  | 'admin'
  | string

export interface SupabaseUserRow {
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

export interface UserResponse {
  id: string
  email: string | null
  lineUserId: string | null
  displayName: string | null
  role: string | null
  provider: string | null
  tokenVersion: number
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface UsersListResponse {
  users: UserResponse[]
  count: number
  fetchedAt: string
}

export interface UserUpsertRequest {
  provider: AuthProvider
  handle: string
  role: UserRole
}

export interface UserUpsertResponse {
  status: 'ok'
  user: UserResponse
  processedAt: string
}
