# Admin ダッシュボード刷新計画

**策定日**: 2025-10-20  
**設計原則**: [SF][CA][DRY][RP] - シンプル、クリーンアーキテクチャ、重複排除、可読性優先

---

## 現状分析

### 既存ページ構成
```
apps/web/src/app/admin/
├── dashboard/           # 基本ダッシュボード（統計値ハードコード）
├── messaging/           # LINE配信管理（完成度50%）
├── _components/         # AdminLayout（共通レイアウト）
├── _hooks/              # useAdminAuth
└── [auth pages]/        # login, signup, forgot-password, reset-password
```

### 既存API
```
Workers API (/api/v1/internal/messaging/)
- GET  /stats                    # 無料枠統計
- GET  /friendship-stats         # 友だち追加統計
- GET  /history                  # 送信履歴
- POST /weekly-summary           # 週次まとめ配信
- POST /audition-announcement    # 新着オーディション告知
```

### 現状の課題
1. **dashboard**: 統計値がハードコード（0）、実データ取得なし
2. **messaging**: LINE個別送信機能なし、メール送信機能なし
3. **案件一覧**: ページ自体が存在しない
4. **共通**: ナビゲーション導線が未整備

---

## 実装計画（3フェーズ）

### Phase 1: 基盤整備とダッシュボード刷新 ⭐⭐⭐
**優先度**: 最高  
**目的**: 管理者が一目で全体状況を把握できるダッシュボード

#### 1.1 ディレクトリ構造の整理
```
apps/web/src/app/admin/
├── _components/
│   ├── AdminLayout.tsx           # 既存（そのまま）
│   ├── StatCard.tsx              # 新規：統計カード共通コンポーネント
│   ├── QuickAction.tsx           # 新規：クイックアクション共通コンポーネント
│   └── Navigation.tsx            # 新規：サイドバーナビゲーション
├── _hooks/
│   ├── useAdminAuth.tsx          # 既存（そのまま）
│   └── useAdminStats.tsx         # 新規：統計データ取得フック
├── dashboard/
│   ├── _components/
│   │   ├── OverviewCards.tsx    # KPI概要カード群
│   │   ├── RecentActivity.tsx   # 最新アクティビティ
│   │   └── QuickActions.tsx     # クイックアクション
│   └── page.tsx                  # ダッシュボードメインページ
└── ...
```

#### 1.2 Workers API拡張
```typescript
新規エンドポイント:
- GET /api/v1/admin/stats/overview
  └ 返却: {
      totalUsers: number
      totalAuditions: number
      totalOrganizers: number
      totalApplications: number
      recentActivities: Activity[]
    }

- GET /api/v1/admin/stats/recent-activities
  └ 返却: Activity[] (最新10件)
```

#### 1.3 ダッシュボードKPI設計
| カード名 | 表示内容 | データソース |
|---------|----------|------------|
| 総ユーザー数 | LINE登録ユーザー総数 | `users` テーブル |
| オーディション数 | 公開中/終了/合計 | `auditions` テーブル |
| 主催者数 | 有効な主催者アカウント数 | `organizers` テーブル |
| 応募総数 | 全期間の応募数 | `audition_applications` テーブル |
| LINE友だち追加率 | 友だち追加済み/全体 | `users.line_friendship_status` |
| 今月の配信数 | LINE配信数/無料枠 | `messaging_logs` テーブル |

#### 1.4 実装タスク
- [ ] `StatCard.tsx` 共通コンポーネント作成
- [ ] `Navigation.tsx` サイドバーナビゲーション作成
- [ ] Workers API `/admin/stats/overview` 実装
- [ ] Workers API `/admin/stats/recent-activities` 実装
- [ ] `useAdminStats.tsx` フック作成
- [ ] `dashboard/page.tsx` リファクタリング（実データ表示）
- [ ] `OverviewCards.tsx` KPIカード群実装
- [ ] `RecentActivity.tsx` 最新アクティビティ実装

---

### Phase 2: メッセージング機能拡張 ⭐⭐⭐
**優先度**: 高  
**目的**: LINEユーザーへの個別送信、メールユーザーへの通知機能

#### 2.1 ディレクトリ構造拡張
```
apps/web/src/app/admin/messaging/
├── _components/
│   ├── FriendshipStats.tsx       # 既存（そのまま）
│   ├── MessagingQuota.tsx        # 既存（そのまま）
│   ├── BroadcastActions.tsx     # 既存（そのまま）
│   ├── SendHistory.tsx          # 既存（そのまま）
│   ├── UserFriendshipList.tsx   # 既存（そのまま）
│   ├── LineMessageComposer.tsx  # 新規：LINE個別送信フォーム
│   ├── EmailMessageComposer.tsx # 新規：メール送信フォーム
│   └── SegmentSelector.tsx      # 新規：セグメント選択UI
└── page.tsx                      # リファクタリング（タブ切り替え追加）
```

#### 2.2 Workers API拡張
```typescript
新規エンドポイント:
- POST /api/v1/admin/messaging/line/individual
  └ リクエスト: { userId: string, message: string }
  └ 用途: LINE個別送信

- POST /api/v1/admin/messaging/email/send
  └ リクエスト: { 
      to: string[], 
      subject: string, 
      body: string,
      template?: string 
    }
  └ 用途: メール送信

- GET /api/v1/admin/messaging/templates
  └ 返却: MessageTemplate[] (定型文テンプレート)

- POST /api/v1/admin/messaging/line/segment
  └ リクエスト: { 
      segment: 'all' | 'friends' | 'applied' | 'selected',
      message: string 
    }
  └ 用途: セグメント別配信
```

#### 2.3 機能要件
**LINEセクション**
- ユーザー一覧（既存）にチェックボックス追加
- 選択ユーザーへの一括送信機能
- 個別送信機能（ユーザー詳細から）
- セグメント選択（全員/友だちのみ/応募者のみ/合格者のみ）
- メッセージテンプレート選択

**メールセクション**
- 主催者一覧表示
- メール送信フォーム（To, Subject, Body）
- テンプレート選択（新規応募通知、締切通知など）
- 送信履歴表示

#### 2.4 実装タスク
- [ ] `LineMessageComposer.tsx` 個別送信フォーム作成
- [ ] `EmailMessageComposer.tsx` メール送信フォーム作成
- [ ] `SegmentSelector.tsx` セグメント選択UI作成
- [ ] Workers API `/admin/messaging/line/individual` 実装
- [ ] Workers API `/admin/messaging/email/send` 実装（AWS SES連携）
- [ ] Workers API `/admin/messaging/templates` 実装
- [ ] Workers API `/admin/messaging/line/segment` 実装
- [ ] `messaging/page.tsx` タブ切り替えUI追加（LINE/メール）
- [ ] メッセージテンプレート定義（`notification-templates.ts`拡張）
- [ ] 送信履歴にメール送信履歴を追加

---

### Phase 3: 案件一覧ページ新設 ⭐⭐
**優先度**: 中  
**目的**: オーディション管理の効率化

#### 3.1 ディレクトリ構造
```
apps/web/src/app/admin/auditions/
├── _components/
│   ├── AuditionList.tsx         # オーディション一覧テーブル
│   ├── AuditionFilters.tsx      # フィルタUI（ステータス、ジャンル）
│   ├── AuditionSearchBar.tsx    # 検索バー
│   └── AuditionStatusBadge.tsx  # ステータスバッジ
└── page.tsx                      # 一覧ページ
```

#### 3.2 Workers API拡張
```typescript
新規エンドポイント:
- GET /api/v1/admin/auditions
  └ クエリパラメータ: {
      status?: 'draft' | 'published' | 'closed'
      genre?: string
      search?: string
      page?: number
      limit?: number
    }
  └ 返却: {
      auditions: Audition[]
      total: number
      page: number
      totalPages: number
    }

- GET /api/v1/admin/auditions/:id
  └ 返却: AuditionDetail（詳細情報）

- PATCH /api/v1/admin/auditions/:id/status
  └ リクエスト: { status: 'draft' | 'published' | 'closed' }
  └ 用途: ステータス一括変更
```

#### 3.3 機能要件
- オーディション一覧表示（ページネーション）
- フィルタ機能（ステータス、ジャンル、主催者）
- 検索機能（タイトル、説明文）
- ソート機能（作成日、締切日、応募数）
- ステータス一括変更（公開/非公開/終了）
- オーディション詳細ページへのリンク

#### 3.4 実装タスク
- [ ] `AuditionList.tsx` 一覧テーブルコンポーネント作成
- [ ] `AuditionFilters.tsx` フィルタUI作成
- [ ] `AuditionSearchBar.tsx` 検索バー作成
- [ ] `AuditionStatusBadge.tsx` ステータスバッジ作成
- [ ] Workers API `/admin/auditions` 実装（ページネーション、フィルタ、検索）
- [ ] Workers API `/admin/auditions/:id` 実装
- [ ] Workers API `/admin/auditions/:id/status` 実装
- [ ] `auditions/page.tsx` 一覧ページ作成
- [ ] ページネーションコンポーネント作成（共通化）

---

## 共通改善事項

### ナビゲーション導線
```typescript
// apps/web/src/app/admin/_components/Navigation.tsx

const menuItems = [
  { 
    label: 'ダッシュボード', 
    href: '/admin/dashboard', 
    icon: 'DashboardIcon' 
  },
  { 
    label: 'オーディション管理', 
    href: '/admin/auditions', 
    icon: 'AuditionIcon' 
  },
  { 
    label: 'メッセージ配信', 
    href: '/admin/messaging', 
    icon: 'MessagingIcon' 
  },
  { 
    label: 'ユーザー管理', 
    href: '/admin/users', 
    icon: 'UsersIcon',
    badge: 'Coming Soon' 
  },
  { 
    label: '主催者管理', 
    href: '/admin/organizers', 
    icon: 'OrganizersIcon',
    badge: 'Coming Soon' 
  },
]
```

### 共通コンポーネント整理
```
apps/web/src/shared/components/admin/
├── StatCard.tsx           # 統計カード
├── DataTable.tsx          # データテーブル（ページネーション付き）
├── FilterPanel.tsx        # フィルタパネル
├── SearchBar.tsx          # 検索バー
├── StatusBadge.tsx        # ステータスバッジ
├── EmptyState.tsx         # 空状態表示
└── LoadingSpinner.tsx     # ローディングスピナー
```

### API レスポンス形式統一
```typescript
// 成功時
{
  success: true,
  data: T,
  meta?: {
    page?: number
    totalPages?: number
    total?: number
  }
}

// エラー時
{
  success: false,
  error: string,
  details?: string
}
```

---

## スケジュール（推奨）

| Phase | 推定工数 | 優先度 |
|-------|---------|--------|
| Phase 1: ダッシュボード刷新 | 2-3日 | ⭐⭐⭐ 最高 |
| Phase 2: メッセージング拡張 | 3-4日 | ⭐⭐⭐ 高 |
| Phase 3: 案件一覧ページ | 2-3日 | ⭐⭐ 中 |

**総推定工数**: 7-10日

---

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **状態管理**: React Hooks（useState, useEffect, custom hooks）
- **データ取得**: Fetch API + SWR（検討）

### バックエンド
- **Workers API**: Hono + Cloudflare Workers
- **Database**: Supabase PostgreSQL
- **認証**: Supabase Auth（管理者ロール）
- **メール**: AWS SES（既存設定活用）

---

## テスト戦略

### Phase 1
- [ ] ダッシュボードの統計値が正しく表示されるか
- [ ] KPIカードが実データを取得できるか
- [ ] サイドバーナビゲーションが正しく動作するか

### Phase 2
- [ ] LINE個別送信が正常に動作するか
- [ ] メール送信が正常に動作するか（AWS SES連携）
- [ ] セグメント別配信が正しくフィルタリングされるか
- [ ] 送信履歴にLINE/メール両方が記録されるか

### Phase 3
- [ ] オーディション一覧が正しく表示されるか
- [ ] フィルタ・検索が正常に動作するか
- [ ] ページネーションが正しく動作するか
- [ ] ステータス一括変更が正常に動作するか

---

## マイグレーション計画

### 必要なDB変更
```sql
-- Phase 2用: メール送信履歴テーブル拡張
ALTER TABLE messaging_logs
ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT 'line';
-- 'line' or 'email'

-- Phase 3用: オーディション検索用インデックス
CREATE INDEX IF NOT EXISTS idx_auditions_status 
ON auditions(status);

CREATE INDEX IF NOT EXISTS idx_auditions_created_at 
ON auditions(created_at DESC);
```

---

## リスクと対策

### リスク1: AWS SES設定が未完了
**対策**: Phase 2開始前にAWS SES設定を完了（SendGrid代替も検討）

### リスク2: LINE Messaging API無料枠超過
**対策**: 配信前に無料枠チェック機能を強化（警告UI追加）

### リスク3: パフォーマンス問題（大量データ）
**対策**: ページネーション実装、インデックス最適化、キャッシュ戦略

---

## 実装順序（推奨）

1. **Phase 1-1**: 共通コンポーネント作成（StatCard, Navigation）
2. **Phase 1-2**: Workers API実装（/admin/stats/overview）
3. **Phase 1-3**: ダッシュボードUI刷新
4. **Phase 2-1**: LINE個別送信機能（高優先度）
5. **Phase 2-2**: メール送信機能
6. **Phase 3-1**: オーディション一覧ページ基本実装
7. **Phase 3-2**: フィルタ・検索機能追加

---

## ドキュメント更新

- [ ] `docs/tasks/TODO.md` - 実装進捗を更新
- [ ] `docs/API.md` - 新規APIエンドポイントを追加
- [ ] `docs/COMPONENTS.md` - 共通コンポーネント一覧を作成
- [ ] `README.md` - Admin機能セクションを追加

---

## 設計原則遵守チェックリスト

- [x] **[SF] Simplicity First**: 最小限の実装で最大の価値
- [x] **[CA] Clean Architecture**: 責務分離、レイヤー分割
- [x] **[DRY] Don't Repeat Yourself**: 共通コンポーネント活用
- [x] **[RP] Readability Priority**: 可読性の高いコード
- [x] **[REH] Robust Error Handling**: エラーハンドリング徹底
- [x] **[ISA] Industry Standards**: Next.js/React ベストプラクティス

---

**この計画に従い、段階的かつ確実に実装を進めます。** 🚀
