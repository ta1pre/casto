/**
 * セッションストア
 * Cloudflare KVを使用したセッション管理
 */

import type { Session, SessionStore } from '../types/auth'

export class KVSessionStore implements SessionStore {
  private readonly kv: KVNamespace
  private readonly prefix = 'session:'

  constructor(kv: KVNamespace) {
    this.kv = kv
  }

  async create(session: Session): Promise<void> {
    const sessionId = this.generateSessionId()
    const sessionWithId = { ...session, id: sessionId }

    await this.kv.put(
      this.getKey(sessionId),
      JSON.stringify(sessionWithId),
      {
        expirationTtl: this.getTTL(session.expiresAt)
      }
    )
  }

  async get(sessionId: string): Promise<Session | null> {
    try {
      const data = await this.kv.get(this.getKey(sessionId))
      if (!data) return null

      const session = JSON.parse(data)

      // 有効期限チェック
      if (this.isExpired(session.expiresAt)) {
        await this.delete(sessionId)
        return null
      }

      return session
    } catch (error) {
      console.error('Session store get error:', error)
      return null
    }
  }

  async update(sessionId: string, updates: Partial<Session>): Promise<void> {
    try {
      const existing = await this.get(sessionId)
      if (!existing) {
        throw new Error(`Session not found: ${sessionId}`)
      }

      const updated: Session = {
        ...existing,
        ...updates,
        lastActivity: new Date()
      }

      await this.kv.put(
        this.getKey(sessionId),
        JSON.stringify(updated),
        {
          expirationTtl: this.getTTL(updated.expiresAt)
        }
      )
    } catch (error) {
      console.error('Session store update error:', error)
      throw error
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      await this.kv.delete(this.getKey(sessionId))
    } catch (error) {
      console.error('Session store delete error:', error)
    }
  }

  async isExpired(sessionId: string): Promise<boolean> {
    try {
      const session = await this.get(sessionId)
      return !session || new Date() > new Date(session.expiresAt)
    } catch {
      return true
    }
  }

  async cleanup(): Promise<void> {
    // 古いセッションのクリーンアップ
    // 実際の実装ではKVのlistやscan機能を使って古いセッションを検索・削除
    console.log('Session cleanup executed')
  }

  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getTTL(expiresAt: Date): number {
    const now = Date.now()
    const expires = new Date(expiresAt).getTime()
    const ttl = Math.max(0, Math.floor((expires - now) / 1000))
    return ttl
  }

  private isExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt)
  }
}
