/**
 * セッションマネージャー
 * セッションのライフサイクル管理
 */

import type { Session } from '../types/auth'
import { KVSessionStore } from './session-store'
import { AuthManager } from './auth-manager'

export class SessionManager {
  private sessionStore: KVSessionStore
  private authManager: AuthManager
  private readonly sessionTimeout = 24 * 60 * 60 * 1000 // 24時間
  private readonly refreshThreshold = 60 * 60 * 1000 // 1時間

  constructor(kv: KVNamespace) {
    this.sessionStore = new KVSessionStore(kv)
    this.authManager = new AuthManager()
  }

  /**
   * セッションの作成
   */
  async createSession(authResult: any): Promise<Session> {
    const session: Session = {
      userId: authResult.userId,
      roles: authResult.roles || [],
      permissions: authResult.permissions || [],
      displayName: authResult.displayName,
      provider: authResult.provider,
      expiresAt: new Date(Date.now() + this.sessionTimeout),
      lastActivity: new Date(),
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken
    }

    await this.sessionStore.create(session)
    return session
  }

  /**
   * セッションの取得と検証
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionStore.get(sessionId)

    if (!session) {
      return null
    }

    // セッションの有効期限チェック
    if (this.isSessionExpired(session)) {
      await this.sessionStore.delete(sessionId)
      return null
    }

    // トークンの検証
    const isTokenValid = await this.authManager.verifySession(session.accessToken)
    if (!isTokenValid) {
      await this.sessionStore.delete(sessionId)
      return null
    }

    // 最終活動時間を更新
    await this.updateLastActivity(sessionId)

    return session
  }

  /**
   * セッションの更新
   */
  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    await this.sessionStore.update(sessionId, updates)
  }

  /**
   * セッションの削除
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionStore.delete(sessionId)
  }

  /**
   * セッションの延長
   */
  async extendSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionStore.get(sessionId)
    if (!session) return null

    // リフレッシュトークンがある場合のみ延長
    if (session.refreshToken) {
      try {
        const provider = session.provider
        // 実際にはAuthManager経由でトークンを更新
        const newExpiresAt = new Date(Date.now() + this.sessionTimeout)

        await this.sessionStore.update(sessionId, {
          expiresAt: newExpiresAt,
          lastActivity: new Date()
        })

        return await this.sessionStore.get(sessionId)
      } catch (error) {
        console.error('Session extension failed:', error)
        await this.sessionStore.delete(sessionId)
        return null
      }
    }

    return null
  }

  /**
   * 最終活動時間の更新
   */
  private async updateLastActivity(sessionId: string): Promise<void> {
    await this.sessionStore.update(sessionId, {
      lastActivity: new Date()
    })
  }

  /**
   * セッションの有効期限チェック
   */
  private isSessionExpired(session: Session): boolean {
    return new Date() > new Date(session.expiresAt)
  }

  /**
   * セッションのクリーンアップ
   */
  async cleanup(): Promise<void> {
    await this.sessionStore.cleanup()
  }

  /**
   * セッションIDの検証
   */
  validateSessionId(sessionId: string): boolean {
    return sessionId.startsWith('sess_') && sessionId.length > 20
  }
}
