/**
 * 主催者認証サービス
 * [SFT][REH] Supabase Authを使ったメール認証
 * 
 * admin/auth/service.ts と同じロジックを使用
 */

export {
  signUpWithEmail,
  signInWithEmail,
  assignRole,
  getUserRoles,
  sendPasswordResetEmail,
  updatePassword,
} from '../../admin/auth/service'
