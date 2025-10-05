'use client'

import React from 'react'
import { Settings, User, Bell, Lock, HelpCircle, LogOut, ChevronRight, FileText } from 'lucide-react'
import { useAuth } from '@/shared/hooks/useAuth'

export default function SettingsPage() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    if (confirm('ログアウトしますか?')) {
      await logout()
    }
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">設定</h1>
      </div>

      {/* ユーザー情報 */}
      {user && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user.displayName || 'ユーザー'}</p>
              <p className="text-sm text-muted-foreground">{user.email || 'LINE連携中'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 設定項目 */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground px-2">アカウント</h2>
        
        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">プロフィール編集</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">通知設定</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">プライバシー設定</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* サポート */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground px-2">サポート</h2>
        
        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">ヘルプ・お問い合わせ</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">利用規約</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">プライバシーポリシー</span>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* ログアウト */}
      <button
        onClick={handleLogout}
        className="w-full bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="text-destructive font-medium">ログアウト</span>
      </button>

      {/* バージョン情報 */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">Version 1.0.0</p>
      </div>
    </div>
  )
}
