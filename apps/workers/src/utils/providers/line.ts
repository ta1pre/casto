/**
 * LINE認証プロバイダー
 * 実際のLINE LIFF連携を実装
 */

import type { AuthProviderInterface, User } from '../types/auth'

export class LineAuthProvider implements AuthProviderInterface {
  private readonly channelId: string
  private readonly channelSecret: string
  private readonly baseUrl = 'https://api.line.me'

  constructor() {
    this.channelId = process.env.LINE_CHANNEL_ID || ''
    this.channelSecret = process.env.LINE_CHANNEL_SECRET || ''
  }

  async initialize(): Promise<void> {
    if (!this.channelId || !this.channelSecret) {
      throw new Error('LINE Channel ID and Secret are required')
    }
  }

  async getAccessToken(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await fetch(`${this.baseUrl}/oauth2/v2.1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINE_REDIRECT_URI || '',
        client_id: this.channelId,
        client_secret: this.channelSecret
      })
    })

    if (!response.ok) {
      throw new Error(`LINE token request failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    }
  }

  async getUserInfo(accessToken: string): Promise<Partial<User>> {
    const response = await fetch(`${this.baseUrl}/v2/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`LINE profile request failed: ${response.statusText}`)
    }

    const profile = await response.json()

    return {
      id: profile.userId,
      displayName: profile.displayName,
      lineUserId: profile.userId
    }
  }

  async verifyAccessToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken)
      return true
    } catch {
      return false
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const response = await fetch(`${this.baseUrl}/oauth2/v2.1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.channelId,
        client_secret: this.channelSecret
      })
    })

    if (!response.ok) {
      throw new Error(`LINE token refresh failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    }
  }

  async logout(accessToken: string): Promise<void> {
    // LINEのログアウト処理
    // 実際にはアクセストークンを無効化するAPIを呼び出す
    const response = await fetch(`${this.baseUrl}/oauth2/v2.1/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        access_token: accessToken,
        client_id: this.channelId,
        client_secret: this.channelSecret
      })
    })

    if (!response.ok) {
      throw new Error(`LINE logout failed: ${response.statusText}`)
    }
  }
}
