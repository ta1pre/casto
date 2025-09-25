/**
 * メール認証プロバイダー
 * Supabase Authを使用したメール認証
 */

import type { AuthProviderInterface, User } from '../../types/auth'
import { createClient } from '@supabase/supabase-js'

export class EmailAuthProvider implements AuthProviderInterface {
  private supabase: any

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key are required')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async initialize(): Promise<void> {
    // Supabaseクライアントの初期化確認
    if (!this.supabase) {
      throw new Error('Supabase client not initialized')
    }
  }

  async getAccessToken(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    // メール認証の場合、codeは「email:password」の形式
    const [email, password] = code.split(':')

    if (!email || !password) {
      throw new Error('Invalid email or password format')
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(`Supabase auth failed: ${error.message}`)
    }

    return {
      accessToken: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token
    }
  }

  async getUserInfo(accessToken: string): Promise<Partial<User>> {
    const { data: { user }, error } = await this.supabase.auth.getUser(accessToken)

    if (error || !user) {
      throw new Error(`Failed to get user info: ${error?.message}`)
    }

    return {
      id: user.id,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown',
      email: user.email
    }
  }

  async verifyAccessToken(accessToken: string): Promise<boolean> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser(accessToken)
      return !!user
    } catch {
      return false
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    })

    if (error) {
      throw new Error(`Token refresh failed: ${error.message}`)
    }

    return {
      accessToken: data.session?.access_token || '',
      refreshToken: data.session?.refresh_token
    }
  }

  async logout(accessToken: string): Promise<void> {
    const { error } = await this.supabase.auth.signOut()

    if (error) {
      throw new Error(`Supabase logout failed: ${error.message}`)
    }
  }

  /**
   * パスワードリセットメールの送信
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/reset-password`
    })

    if (error) {
      throw new Error(`Password reset email failed: ${error.message}`)
    }
  }

  /**
   * 新規ユーザー登録
   */
  async signUp(email: string, password: string, metadata?: any): Promise<{ user: any; requiresConfirmation: boolean }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) {
      throw new Error(`User registration failed: ${error.message}`)
    }

    return {
      user: data.user,
      requiresConfirmation: !data.session // メール確認が必要な場合
    }
  }
}
