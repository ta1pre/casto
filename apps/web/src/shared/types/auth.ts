import type { UserResponse } from '@casto/shared'

export type AuthRole =
  | 'applicant'
  | 'fan'
  | 'organizer'
  | 'manager'
  | 'admin'
  | 'crowdfunding'

export type User = UserResponse

export interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithLine: (idToken: string) => Promise<UserResponse>
  requestMagicLink: (params: { email: string; role?: AuthRole; redirectUrl?: string }) => Promise<{
    token: string
    magicLinkUrl?: string
  }>
  verifyMagicLink: (token: string) => Promise<UserResponse>
  logout: () => Promise<void>
  refreshSession: () => Promise<UserResponse | null>
}

export type UseAuthReturn = AuthContextType
