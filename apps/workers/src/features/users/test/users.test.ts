import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'
import usersRoutes from '../routes'
import type { AppBindings } from '../../../types'
import type { UsersListResponse, UserUpsertRequest, UserUpsertResponse } from '@casto/shared'

/**
 * 統合テスト: 実際の Supabase データベースに接続してテスト
 * 
 * 必要な環境変数:
 * - SUPABASE_URL: テスト用 Supabase プロジェクトの URL
 * - SUPABASE_SERVICE_ROLE_KEY: サービスロールキー
 * - JWT_SECRET: JWT 署名用のシークレット
 */

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    '統合テストには環境変数が必要です:\n' +
    '  SUPABASE_URL=your-project-url\n' +
    '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n' +
    '\n' +
    'テスト用の Supabase プロジェクトまたはローカル環境を使用してください。'
  )
}

// 実際の Supabase クライアントを作成
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// テスト用のメールアドレスプレフィックス（クリーンアップ用）
const TEST_EMAIL_PREFIX = 'test-users-api-'

describe('users API - 統合テスト', () => {
  let app: Hono<AppBindings>

  beforeAll(async () => {
    // テスト開始前にテストデータをクリーンアップ
    await supabase
      .from('users')
      .delete()
      .like('email', `${TEST_EMAIL_PREFIX}%`)

    console.log('[Test] テストデータをクリーンアップしました')
  })

  afterAll(async () => {
    // テスト終了後にテストデータをクリーンアップ
    await supabase
      .from('users')
      .delete()
      .like('email', `${TEST_EMAIL_PREFIX}%`)

    console.log('[Test] テスト終了後のクリーンアップ完了')
  })

  beforeEach(() => {
    // Hono アプリを初期化し、環境変数を設定
    app = new Hono<AppBindings>()
    
    // ミドルウェアで環境変数を設定
    app.use('*', async (c, next) => {
      c.env = {
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        JWT_SECRET,
        ENVIRONMENT: 'test'
      } as any
      await next()
    })
    
    app.route('/api/v1', usersRoutes)
  })

  describe('GET /api/v1/users', () => {
    it('実際のデータベースからユーザー一覧を取得し、UsersListResponse 形式で返す', async () => {
      // テストデータを事前に作成
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}@example.com`
      await supabase.from('users').insert({
        email: testEmail,
        display_name: 'テストユーザー',
        role: 'applicant',
        auth_provider: 'email',
        is_active: true
      })

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
      expect(data.users.length).toBeGreaterThanOrEqual(1)

      // 作成したユーザーが含まれているか確認
      const createdUser = data.users.find(u => u.email === testEmail)
      expect(createdUser).toBeDefined()
      expect(createdUser?.displayName).toBe('テストユーザー')

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

      expect(data.stats.total).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/v1/users', () => {
    it('実際のデータベースに新規ユーザーを作成し、UserUpsertResponse 形式で返す', async () => {
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}-new@example.com`
      const payload: UserUpsertRequest = {
        provider: 'email',
        handle: testEmail,
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
      expect(data.user.email).toBe(testEmail)
      expect(data.user).toHaveProperty('displayName')
      expect(data.user).toHaveProperty('role')

      // データベースに実際に作成されたか確認
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single()

      expect(error).toBeNull()
      expect(dbUser).toBeDefined()
      expect(dbUser?.email).toBe(testEmail)
    })

    it('既存ユーザーの場合はUPSERTされ、既存データを返す', async () => {
      const testEmail = `${TEST_EMAIL_PREFIX}${Date.now()}-existing@example.com`
      
      // 最初の作成
      await app.request('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'email',
          handle: testEmail,
          role: 'applicant'
        })
      })

      // 同じメールアドレスで再度作成（UPSERT）
      const res = await app.request('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'email',
          handle: testEmail,
          role: 'organizer' // roleを変更
        })
      })

      expect(res.status).toBe(201)

      const data: UserUpsertResponse = await res.json()
      expect(data.user.email).toBe(testEmail)
      expect(data.user.role).toBe('organizer') // 更新されている

      // データベースで重複していないことを確認
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', testEmail)

      expect(error).toBeNull()
      expect(users).toHaveLength(1) // 重複なし
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
