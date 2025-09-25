/**
 * 認証・認可システムの型定義
 * プロダクション品質の実装
 */

export type AuthProvider = 'line' | 'email'

export interface User {
  id: string
  displayName: string
  email?: string
  lineUserId?: string
  roles: Role[]
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface Session {
  userId: string
  roles: Role[]
  permissions: Permission[]
  displayName: string
  provider: AuthProvider
  expiresAt: Date
  lastActivity: Date
  accessToken: string
  refreshToken?: string
}

export interface AuthRequest {
  provider: AuthProvider
  code?: string
  accessToken?: string
  refreshToken?: string
  email?: string
  password?: string
}

export interface AuthResponse {
  success: boolean
  session?: Session
  error?: string
  requiresVerification?: boolean
  verificationToken?: string
}

export interface AuthProviderInterface {
  /**
   * 認証プロバイダーの初期化
   */
  initialize(): Promise<void>

  /**
   * 認証コードからアクセストークンを取得
   */
  getAccessToken(code: string): Promise<{ accessToken: string; refreshToken?: string }>

  /**
   * アクセストークンからユーザー情報を取得
   */
  getUserInfo(accessToken: string): Promise<Partial<User>>

  /**
   * アクセストークンの検証
   */
  verifyAccessToken(accessToken: string): Promise<boolean>

  /**
   * アクセストークンの更新
   */
  refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }>

  /**
   * ログアウト処理
   */
  logout(accessToken: string): Promise<void>

  /**
   * 新規ユーザー登録（オプション）
   */
  signUp?(email: string, password: string, metadata?: any): Promise<{ user: any; requiresConfirmation: boolean }>
}

export interface SessionStore {
  /**
   * セッションの作成
   */
  create(session: Session): Promise<void>

  /**
   * セッションの取得
   */
  get(sessionId: string): Promise<Session | null>

  /**
   * セッションの更新
   */
  update(sessionId: string, updates: Partial<Session>): Promise<void>

  /**
   * セッションの削除
   */
  delete(sessionId: string): Promise<void>

  /**
   * セッションの有効期限チェック
   */
  isExpired(sessionId: string): Promise<boolean>

  /**
   * 有効期限切れセッションのクリーンアップ
   */
  cleanup(): Promise<void>
}
