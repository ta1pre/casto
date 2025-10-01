import { useContext } from 'react'
import { AuthContext } from '@/shared/providers/AuthProvider'
import type { UseAuthReturn } from '@/shared/types/auth'

export function useAuth(): UseAuthReturn {
  return useContext(AuthContext)
}
