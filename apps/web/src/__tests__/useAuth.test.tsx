/**
 * 認証フックのテスト
 */

import { renderHook, act } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useAuth } from '../hooks/useAuth'

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

// @ts-expect-error JSDOM 環境に localStorage を定義するため
global.localStorage = mockLocalStorage

describe('useAuth', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  )

  describe('Initial State', () => {
    test('should start with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('Session Management', () => {
    test('should handle successful login', async () => {
      const mockSession = {
        userId: 'test-user',
        roles: [{ id: 'fan', name: 'fan', description: 'Fan', permissions: [] }],
        permissions: [{ id: 'content:read', name: 'content:read', resource: 'content', action: 'read' }],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        lastActivity: new Date().toISOString(),
        accessToken: 'test-token'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, session: mockSession })
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        const success = await result.current.login({
          provider: 'email',
          email: 'test@example.com',
          password: 'password'
        })
        expect(success).toBe(true)
      })

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.user?.displayName).toBe('Test User')
      expect(result.current.session?.accessToken).toBe('test-token')
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    test('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false, error: 'Invalid credentials' })
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        const success = await result.current.login({
          provider: 'email',
          email: 'test@example.com',
          password: 'wrong-password'
        })
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Invalid credentials')
    })

    test('should handle logout successfully', async () => {
      const mockSession = {
        userId: 'test-user',
        roles: [],
        permissions: [],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        lastActivity: new Date().toISOString(),
        accessToken: 'test-token'
      }

      // Mock successful logout
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Set initial session
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSession))

      // Re-render to pick up stored session
      const { rerender } = renderHook(() => useAuth(), { wrapper })
      rerender({})

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })

    test('should handle session refresh', async () => {
      const oldSession = {
        userId: 'test-user',
        roles: [],
        permissions: [],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        lastActivity: new Date().toISOString(),
        accessToken: 'old-token',
        refreshToken: 'refresh-token'
      }

      const newSession = {
        ...oldSession,
        accessToken: 'new-token',
        expiresAt: new Date(Date.now() + 7200000).toISOString()
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, session: newSession })
      } as Response)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        const success = await result.current.refreshSession()
        expect(success).toBe(true)
      })

      expect(result.current.session?.accessToken).toBe('new-token')
    })
  })

  describe('Permission and Role Checks', () => {
    test('should check permissions correctly', async () => {
      const mockSession = {
        userId: 'test-user',
        roles: [{ id: 'fan', name: 'fan', description: 'Fan', permissions: [] }],
        permissions: [
          { id: 'content:read', name: 'content:read', resource: 'content', action: 'read' },
          { id: 'profile:write', name: 'profile:write', resource: 'profile', action: 'write' }
        ],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        lastActivity: new Date().toISOString(),
        accessToken: 'test-token'
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSession))

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.hasPermission('content:read')).toBe(true)
      expect(result.current.hasPermission('user:write')).toBe(false)
      expect(result.current.hasAnyPermission(['content:read', 'user:write'])).toBe(true)
      expect(result.current.hasAnyPermission(['user:write', 'system:admin'])).toBe(false)
    })

    test('should check roles correctly', async () => {
      const mockSession = {
        userId: 'test-user',
        roles: [
          { id: 'fan', name: 'fan', description: 'Fan', permissions: [] },
          { id: 'host', name: 'host', description: 'Host', permissions: [] }
        ],
        permissions: [],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        lastActivity: new Date().toISOString(),
        accessToken: 'test-token'
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSession))

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.hasRole('fan')).toBe(true)
      expect(result.current.hasRole('admin')).toBe(false)
      expect(result.current.hasAnyRole(['fan', 'host'])).toBe(true)
      expect(result.current.hasAnyRole(['admin', 'manager'])).toBe(false)
    })

    test('should check authentication status', async () => {
      const expiredSession = {
        userId: 'test-user',
        roles: [],
        permissions: [],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1時間前
        lastActivity: new Date().toISOString(),
        accessToken: 'test-token'
      }

      const validSession = {
        userId: 'test-user',
        roles: [],
        permissions: [],
        displayName: 'Test User',
        provider: 'email' as const,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        lastActivity: new Date().toISOString(),
        accessToken: 'test-token'
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSession))

      const { result } = renderHook(() => useAuth(), { wrapper })

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.isAuthenticated()).toBe(false)

      // Update with valid session
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validSession))

      const { rerender } = renderHook(() => useAuth(), { wrapper })
      rerender({})

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      expect(result.current.isAuthenticated()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await act(async () => {
        const success = await result.current.login({
          provider: 'email',
          email: 'test@example.com',
          password: 'password'
        })
        expect(success).toBe(false)
      })

      expect(result.current.error).toBe('Login failed')
    })

    test('should handle malformed session data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })
})
