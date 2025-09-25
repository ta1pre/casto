import { useContext } from 'react'
import { AuthContext } from '@/providers/AuthProvider'
import type { UseAuthReturn } from '../types/auth'

export function useAuth(): UseAuthReturn {
  return useContext(AuthContext)
}
