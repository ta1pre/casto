export type AuthRole =
  | 'applicant'
  | 'fan'
  | 'organizer'
  | 'manager'
  | 'admin'
  | 'crowdfunding'

export interface User {
  id: string
  email?: string | null
  lineUserId?: string | null
  displayName?: string | null
  provider: 'email' | 'line'
  role: AuthRole
  tokenVersion?: number
  createdAt?: string
  updatedAt?: string
  pictureUrl?: string | null
  statusMessage?: string | null
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithLine: (idToken: string) => Promise<User>
  requestMagicLink: (params: { email: string; role?: AuthRole; redirectUrl?: string }) => Promise<{
    token: string
    magicLinkUrl?: string
  }>
  verifyMagicLink: (token: string) => Promise<User>
  logout: () => Promise<void>
  refreshSession: () => Promise<User | null>
}

export type UseAuthReturn = AuthContextType
