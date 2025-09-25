export interface User {
  id: string
  email?: string
  name?: string
  displayName?: string
  provider: 'email' | 'line'
  role: 'applicant' | 'fan' | 'organizer' | 'manager'
  pictureUrl?: string
  statusMessage?: string
}

export interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

export type UseAuthReturn = AuthContextType
