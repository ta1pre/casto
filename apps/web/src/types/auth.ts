/**
 * Next.jsフロントエンド用の型定義
 */

export type AuthProvider = 'line' | 'email'

export interface User {
  id: string
  displayName: string
  email?: string
  lineUserId?: string
  roles: Role[]
  permissions: Permission[]
  provider: AuthProvider
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface Session {
  userId: string
  roles: Role[]
  permissions: Permission[]
  displayName: string
  provider: AuthProvider
  expiresAt: Date
  lastActivity: Date
  accessToken: string
  refreshToken?: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export interface LoginRequest {
  provider: AuthProvider
  code?: string
  email?: string
  password?: string
}

export interface AuthResponse {
  success: boolean
  session?: Session
  error?: string
  requiresVerification?: boolean
  verificationToken?: string
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
