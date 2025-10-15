/**
 * 認証ページ用レイアウト（認証不要）
 * [SF][CA] ログイン・サインアップ・パスワードリセット用
 */

import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
