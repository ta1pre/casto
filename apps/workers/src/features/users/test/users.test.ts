import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import usersRoutes from '../routes'
import type { AppBindings } from '../../../types'
import type { UsersListResponse, UserUpsertRequest, UserUpsertResponse } from '@casto/shared'

// Supabase クライアントのモック
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: [
          {
            id: 'user-1',
            email: 'test1@example.com',
            line_user_id: null,
            display_name: 'テストユーザー1',
            role: 'applicant',
            auth_provider: 'email',
            token_version: 0,
            is_active: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 'user-2',
            email: null,
            line_user_id: 'U1234567890',
            display_name: 'LINEユーザー',
            role: 'applicant',
            auth_provider: 'line',
            token_version: 0,
            is_active: true,
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z'
          }
        ],
        error: null
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: 'new-user',
            email: 'new@example.com',
            line_user_id: null,
            display_name: 'new@example.com',
            role: 'applicant',
            auth_provider: 'email',
            token_version: 0,
            is_active: true,
            created_at: '2025-01-03T00:00:00Z',
            updated_at: '2025-01-03T00:00:00Z'
          },
          error: null
        }))
      }))
    }))
  }))
}

// createSupabaseClient のモック
vi.mock('../../../lib/supabase', () => ({
  createSupabaseClient: vi.fn(() => mockSupabaseClient)
}))

describe('users API', () => {
  let app: Hono<AppBindings>

  beforeEach(() => {
    app = new Hono<AppBindings>()
    app.route('/api/v1', usersRoutes)
    vi.clearAllMocks()
  })

  describe('GET /api/v1/users', () => {
    it('ユーザー一覧を取得し、UsersListResponse 形式で返す', async () => {
      const res = await app.request('/api/v1/users', {
        method: 'GET'
      })

      expect(res.status).toBe(200)

      const data: UsersListResponse = await res.json()

      // レスポンス形式の検証
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('count')
      expect(data).toHaveProperty('fetchedAt')
      expect(data).toHaveProperty('stats')

      // users 配列の検証
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.users).toHaveLength(2)

      // 各ユーザーの型検証（camelCase）
      const firstUser = data.users[0]
      expect(firstUser).toHaveProperty('id')
      expect(firstUser).toHaveProperty('email')
      expect(firstUser).toHaveProperty('lineUserId')
      expect(firstUser).toHaveProperty('displayName')
      expect(firstUser).toHaveProperty('role')
      expect(firstUser).toHaveProperty('provider')
      expect(firstUser).toHaveProperty('tokenVersion')
      expect(firstUser).toHaveProperty('isActive')
      expect(firstUser).toHaveProperty('createdAt')
      expect(firstUser).toHaveProperty('updatedAt')

      // stats の検証
      expect(data.stats).toHaveProperty('total')
      expect(data.stats).toHaveProperty('active')
      expect(data.stats).toHaveProperty('inactive')
      expect(data.stats).toHaveProperty('byProvider')
      expect(data.stats).toHaveProperty('byRole')

      expect(data.stats.total).toBe(2)
      expect(data.stats.active).toBe(2)
      expect(data.stats.byProvider).toHaveProperty('email')
      expect(data.stats.byProvider).toHaveProperty('line')
    })
  })

  describe('POST /api/v1/users', () => {
    it('新規ユーザーを作成し、UserUpsertResponse 形式で返す', async () => {
      const payload: UserUpsertRequest = {
        provider: 'email',
        handle: 'new@example.com',
        role: 'applicant'
      }

      const res = await app.request('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      expect(res.status).toBe(201)

      const data: UserUpsertResponse = await res.json()

      // レスポンス形式の検証
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('processedAt')

      expect(data.status).toBe('ok')

      // ユーザー情報の検証（camelCase）
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('email')
      expect(data.user).toHaveProperty('displayName')
      expect(data.user).toHaveProperty('role')
      expect(data.user).toHaveProperty('provider')
      expect(data.user.provider).toBe('email')
    })

    it('provider が不正な場合は 400 エラーを返す', async () => {
      const payload = {
        provider: 'invalid',
        handle: 'test@example.com'
      }

      const res = await app.request('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
    })

    it('handle が空の場合は 400 エラーを返す', async () => {
      const payload = {
        provider: 'email',
        handle: ''
      }

      const res = await app.request('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      expect(res.status).toBe(400)

      const data = await res.json()
      expect(data).toHaveProperty('error')
    })
  })
})
