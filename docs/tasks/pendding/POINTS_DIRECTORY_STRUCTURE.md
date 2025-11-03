# ポイント機能 ディレクトリ構成詳細

**策定日**: 2025-10-20  
**設計原則**: [SF][CA][DRY] - 機能ごとに集約、散らばらない構成

---

## 1. Backend構成（Workers）

### 1.1 フィーチャー単位で集約

```
apps/workers/src/features/
├── points/                                 # 主催者向けポイント機能
│   ├── routes.ts                           # ルート定義（/api/v1/points/*）
│   ├── service.ts                          # ビジネスロジック
│   │   ├── getAccount()                    # アカウント取得
│   │   ├── getTransactions()              # 取引履歴
│   │   ├── checkViewingEligibility()      # 閲覧可否チェック
│   │   ├── consumeViewingPoints()         # ポイント消費
│   │   └── getPointsPlans()               # プラン一覧
│   ├── stripe.service.ts                   # Stripe連携専用
│   │   ├── createCheckoutSession()        # Checkout作成
│   │   ├── handleWebhook()                # Webhook処理
│   │   ├── verifyWebhookSignature()       # 署名検証
│   │   └── issuePoints()                  # ポイント付与
│   ├── types.ts                            # 型定義
│   │   ├── PointsAccount                  # アカウント型
│   │   ├── PointsTransaction              # 取引型
│   │   ├── PointsPlan                     # プラン型
│   │   └── ViewingEligibility             # 閲覧可否型
│   └── validation.ts                       # バリデーション
│       ├── validatePurchaseRequest()
│       └── validateViewingRequest()
│
├── admin/
│   └── points/                             # Admin向けポイント管理
│       ├── routes.ts                       # ルート定義（/api/v1/admin/points/*）
│       ├── service.ts                      # Admin専用ロジック
│       │   ├── getAllAccounts()           # 全アカウント取得
│       │   ├── getAccountDetail()         # 詳細取得
│       │   ├── grantPoints()              # 手動付与
│       │   ├── deductPoints()             # 手動減算
│       │   ├── getPlans()                 # プラン管理
│       │   ├── createPlan()               # プラン作成
│       │   ├── updatePlan()               # プラン更新
│       │   ├── deletePlan()               # プラン削除
│       │   └── updateSettings()           # 設定更新
│       ├── types.ts                        # Admin専用型
│       └── validation.ts                   # バリデーション
│
└── webhook/
    └── stripe.routes.ts                    # Webhook受信エンドポイント
        └── POST /api/v1/webhook/stripe
```

### 1.2 共有ライブラリ

```
apps/workers/src/lib/
├── stripe.ts                               # Stripe SDK初期化
├── supabase.ts                             # Supabase クライアント（既存）
└── constants.ts                            # 定数定義
    └── DEFAULT_VIEWING_POINT_COST = 100
```

---

## 2. Frontend構成（Next.js）

### 2.1 主催者向けページ

```
apps/web/src/app/organizer/
├── points/                                 # ポイント専用ディレクトリ
│   ├── page.tsx                            # 残高・購入導線
│   │   └── <BalanceCard>                  # 残高カード
│   │   └── <QuickPurchaseButton>          # 購入ボタン
│   │   └── <RecentTransactions>           # 最近の取引
│   │
│   ├── purchase/                           # 購入フロー
│   │   ├── page.tsx                        # プラン選択
│   │   │   └── <PlanSelector>
│   │   ├── success/page.tsx                # 購入成功
│   │   └── cancel/page.tsx                 # 購入キャンセル
│   │
│   ├── history/                            # 取引履歴
│   │   └── page.tsx                        # 履歴一覧
│   │       └── <TransactionList>
│   │       └── <FilterControls>
│   │
│   └── _components/                        # ポイント専用コンポーネント
│       ├── BalanceCard.tsx                 # 残高表示カード
│       ├── PlanSelector.tsx                # プラン選択UI
│       ├── PlanCard.tsx                    # プランカード
│       ├── TransactionList.tsx             # 取引一覧
│       ├── TransactionItem.tsx             # 取引アイテム
│       └── PointsBadge.tsx                 # ポイントバッジ
│
└── auditions/
    └── [id]/
        └── applications/
            ├── page.tsx                    # 応募者一覧
            └── [applicationId]/
                ├── page.tsx                # 応募者詳細（閲覧課金）
                └── _components/
                    ├── ViewingConfirmModal.tsx       # 閲覧確認
                    ├── InsufficientPointsModal.tsx   # 残高不足
                    └── ApplicationDetail.tsx         # 詳細表示
```

### 2.2 Admin向けページ

```
apps/web/src/app/admin/
└── points/                                 # ポイント管理専用ディレクトリ
    ├── page.tsx                            # 統計・アカウント一覧
    │   └── <PointsOverview>               # 統計サマリー
    │   └── <AccountList>                  # アカウント一覧
    │
    ├── accounts/
    │   └── [id]/
    │       └── page.tsx                    # 個別アカウント詳細
    │           └── <AccountHeader>        # アカウント情報
    │           └── <TransactionHistory>   # 取引履歴
    │           └── <PointGrantModal>      # 付与モーダル
    │           └── <ViewedApplications>   # 閲覧履歴
    │
    ├── plans/
    │   └── page.tsx                        # プラン管理
    │       └── <PlanList>                 # プラン一覧
    │       └── <PlanEditor>               # プラン編集
    │       └── <CreatePlanButton>         # 新規作成
    │
    ├── settings/
    │   └── page.tsx                        # 設定管理
    │       └── <DefaultCostSettings>      # デフォルト単価
    │       └── <SystemSettings>           # システム設定
    │
    └── _components/                        # Admin専用コンポーネント
        ├── PointsOverview.tsx              # 統計サマリー
        ├── AccountList.tsx                 # アカウント一覧テーブル
        ├── AccountCard.tsx                 # アカウントカード
        ├── TransactionHistory.tsx          # 取引履歴テーブル
        ├── PointGrantModal.tsx             # ポイント付与モーダル
        ├── PlanList.tsx                    # プラン一覧
        ├── PlanEditor.tsx                  # プラン編集フォーム
        ├── DefaultCostSettings.tsx         # デフォルト単価設定
        └── StripeConnectionStatus.tsx      # Stripe接続状態
```

### 2.3 共有コンポーネント

```
apps/web/src/shared/
├── components/
│   └── points/                             # ポイント共通コンポーネント
│       ├── PointsBadge.tsx                 # ポイント残高バッジ（ヘッダー用）
│       ├── PointsIcon.tsx                  # ポイントアイコン
│       ├── TransactionTypeLabel.tsx        # 取引種別ラベル
│       └── PointsFormatters.tsx            # フォーマット関数
│
├── hooks/
│   └── points/                             # ポイント専用Hooks
│       ├── usePointsAccount.ts             # アカウント取得
│       ├── usePointsTransactions.ts        # 取引履歴取得
│       ├── usePointsPurchase.ts            # 購入処理
│       ├── useViewingCheck.ts              # 閲覧可否チェック
│       └── usePointsConsume.ts             # ポイント消費
│
└── utils/
    └── points/                             # ポイント専用ユーティリティ
        ├── formatPoints.ts                 # 「1,000pt」表示
        ├── formatPrice.ts                  # 「¥1,100」表示
        ├── calculateDiscount.ts            # 割引計算
        └── transactionTypeLabels.ts        # 種別ラベル定義
```

---

## 3. Database構成

### 3.1 マイグレーションファイル

```
supabase/migrations/
└── 20251020100000_create_points_system.sql
    ├── points_accounts テーブル作成
    ├── points_transactions テーブル作成
    ├── points_plans テーブル作成
    ├── viewed_applications テーブル作成
    ├── auditions テーブル拡張
    ├── インデックス作成
    ├── RLSポリシー設定
    └── system_settings 初期データ
```

### 3.2 RLSポリシー

```sql
-- points_accounts: ユーザーは自分のみ、Adminは全員
CREATE POLICY "Users can view own account"
  ON points_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all accounts"
  ON points_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- points_transactions: アカウントに紐づく
CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM points_accounts WHERE user_id = auth.uid()
    )
  );

-- viewed_applications: ユーザーは自分のみ
CREATE POLICY "Users can view own viewed"
  ON viewed_applications FOR SELECT
  USING (user_id = auth.uid());
```

---

## 4. 型定義の統一

### 4.1 共有型（Backend & Frontend）

```typescript
// packages/shared/src/types/points.ts
export interface PointsAccount {
  id: string
  user_id: string                    // ✅ user_id（将来拡張対応）
  account_type: 'organizer' | 'talent'  // 将来: 'talent' も対応
  balance: number
  total_purchased: number
  total_consumed: number
  created_at: string
  updated_at: string
}

export interface PointsTransaction {
  id: string
  account_id: string
  transaction_type: TransactionType
  amount: number
  balance_after: number
  related_application_id?: string
  related_stripe_session_id?: string
  metadata?: Record<string, any>
  notes?: string
  created_at: string
}

export type TransactionType =
  | 'purchase'
  | 'consumption'
  | 'admin_grant'
  | 'admin_deduct'
  | 'bonus'
  | 'subscription'

export interface PointsPlan {
  id: string
  name: string
  points: number
  price_jpy: number
  stripe_product_id?: string
  stripe_price_id?: string
  bonus_points: number
  is_active: boolean
  display_order: number
  created_at: string
}

export interface ViewingEligibility {
  canView: boolean
  pointsRequired: number
  currentBalance: number
  alreadyViewed: boolean
  reason?: 'insufficient_balance' | 'unlimited' | 'max_reached'
}
```

---

## 5. 環境変数管理

### 5.1 Workers環境変数

```toml
# apps/workers/wrangler.toml
[env.development.vars]
STRIPE_SECRET_KEY = "sk_test_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."
STRIPE_PUBLISHABLE_KEY = "pk_test_..."

[env.production.vars]
STRIPE_SECRET_KEY = "sk_live_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."
STRIPE_PUBLISHABLE_KEY = "pk_live_..."
```

### 5.2 Next.js環境変数

```bash
# apps/web/.env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 6. API呼び出しの統一

### 6.1 フロントエンド共通API関数

```typescript
// apps/web/src/shared/api/points.ts
import { apiFetch } from '../utils/api'

export const pointsApi = {
  // 主催者向け
  getAccount: () => apiFetch<PointsAccount>('/api/v1/points/account'),
  getTransactions: (params?: { limit?: number; offset?: number }) =>
    apiFetch<{ transactions: PointsTransaction[] }>('/api/v1/points/transactions', { params }),
  getPlans: () => apiFetch<{ plans: PointsPlan[] }>('/api/v1/points/plans'),
  createCheckout: (planId: string) =>
    apiFetch<{ url: string }>('/api/v1/points/purchase', {
      method: 'POST',
      body: { planId }
    }),
  checkViewing: (applicationId: string) =>
    apiFetch<ViewingEligibility>('/api/v1/points/check-viewing', {
      method: 'POST',
      body: { applicationId }
    }),
  consumeViewing: (applicationId: string) =>
    apiFetch<{ success: boolean; newBalance: number }>('/api/v1/points/consume-viewing', {
      method: 'POST',
      body: { applicationId }
    }),

  // Admin向け
  admin: {
    getAccounts: () =>
      apiFetch<{ accounts: PointsAccount[] }>('/api/v1/admin/points/accounts'),
    getAccountDetail: (id: string) =>
      apiFetch<PointsAccount>(`/api/v1/admin/points/accounts/${id}`),
    grantPoints: (accountId: string, amount: number, notes: string) =>
      apiFetch('/api/v1/admin/points/grant', {
        method: 'POST',
        body: { accountId, amount, notes }
      }),
    getPlans: () =>
      apiFetch<{ plans: PointsPlan[] }>('/api/v1/admin/points/plans'),
    createPlan: (plan: Partial<PointsPlan>) =>
      apiFetch('/api/v1/admin/points/plans', {
        method: 'POST',
        body: plan
      }),
    updatePlan: (id: string, plan: Partial<PointsPlan>) =>
      apiFetch(`/api/v1/admin/points/plans/${id}`, {
        method: 'PATCH',
        body: plan
      })
  }
}
```

---

## 7. 実装ファイル一覧（Phase 1）

### 7.1 作成が必要なファイル

#### Backend（20ファイル）
```
✓ supabase/migrations/20251020100000_create_points_system.sql
✓ apps/workers/src/features/points/routes.ts
✓ apps/workers/src/features/points/service.ts
✓ apps/workers/src/features/points/stripe.service.ts
✓ apps/workers/src/features/points/types.ts
✓ apps/workers/src/features/points/validation.ts
✓ apps/workers/src/features/admin/points/routes.ts
✓ apps/workers/src/features/admin/points/service.ts
✓ apps/workers/src/features/admin/points/types.ts
✓ apps/workers/src/features/admin/points/validation.ts
✓ apps/workers/src/features/webhook/stripe.routes.ts
✓ apps/workers/src/lib/stripe.ts
```

#### Frontend（30ファイル）
```
✓ packages/shared/src/types/points.ts
✓ apps/web/src/shared/api/points.ts
✓ apps/web/src/shared/hooks/points/usePointsAccount.ts
✓ apps/web/src/shared/hooks/points/usePointsTransactions.ts
✓ apps/web/src/shared/hooks/points/usePointsPurchase.ts
✓ apps/web/src/shared/hooks/points/useViewingCheck.ts
✓ apps/web/src/shared/hooks/points/usePointsConsume.ts
✓ apps/web/src/shared/components/points/PointsBadge.tsx
✓ apps/web/src/shared/components/points/PointsIcon.tsx
✓ apps/web/src/shared/components/points/TransactionTypeLabel.tsx
✓ apps/web/src/shared/utils/points/formatPoints.ts
✓ apps/web/src/shared/utils/points/formatPrice.ts
✓ apps/web/src/app/organizer/points/page.tsx
✓ apps/web/src/app/organizer/points/purchase/page.tsx
✓ apps/web/src/app/organizer/points/purchase/success/page.tsx
✓ apps/web/src/app/organizer/points/purchase/cancel/page.tsx
✓ apps/web/src/app/organizer/points/history/page.tsx
✓ apps/web/src/app/organizer/points/_components/BalanceCard.tsx
✓ apps/web/src/app/organizer/points/_components/PlanSelector.tsx
✓ apps/web/src/app/organizer/points/_components/TransactionList.tsx
✓ apps/web/src/app/organizer/auditions/[id]/applications/[applicationId]/_components/ViewingConfirmModal.tsx
✓ apps/web/src/app/organizer/auditions/[id]/applications/[applicationId]/_components/InsufficientPointsModal.tsx
✓ apps/web/src/app/admin/points/page.tsx
✓ apps/web/src/app/admin/points/accounts/[id]/page.tsx
✓ apps/web/src/app/admin/points/plans/page.tsx
✓ apps/web/src/app/admin/points/settings/page.tsx
✓ apps/web/src/app/admin/points/_components/AccountList.tsx
✓ apps/web/src/app/admin/points/_components/TransactionHistory.tsx
✓ apps/web/src/app/admin/points/_components/PointGrantModal.tsx
✓ apps/web/src/app/admin/points/_components/PlanEditor.tsx
```

---

## 8. 補足

### 8.1 散らばらない設計のポイント
- ポイント機能は `points/` ディレクトリに集約
- Admin機能は `admin/points/` で分離
- 共有ロジックは `shared/` に配置
- API呼び出しは `shared/api/points.ts` で統一
- 型定義は `packages/shared` で一元管理

### 8.2 拡張性

**将来追加される機能でも構造を維持**:

#### ポイントルール管理（Admin画面から設定）
```
apps/workers/src/features/admin/points/
├── rules.service.ts              # ルール管理ロジック
└── cron.service.ts               # Cron実行ハンドラ

apps/web/src/app/admin/points/
└── rules/
    ├── page.tsx                  # ルール一覧
    ├── new/page.tsx              # ルール作成
    ├── [id]/edit/page.tsx        # ルール編集
    └── _components/
        ├── RuleList.tsx
        ├── RuleEditor.tsx
        ├── CronExpressionBuilder.tsx
        └── ExecutionHistory.tsx
```

#### キャスト向けポイント（ギャラ/投げ銭）
```
apps/workers/src/features/
├── points/
│   ├── withdrawal.service.ts     # 出金処理
│   └── tip.service.ts            # 投げ銭処理
└── admin/
    └── points/
        └── withdrawal.service.ts  # 出金承認

apps/web/src/app/liff/
└── points/                        # キャスト向けポイント
    ├── page.tsx                   # 残高・履歴
    ├── withdraw/page.tsx          # 出金申請
    └── bank-accounts/page.tsx     # 銀行口座管理

apps/web/src/app/admin/
└── points/
    └── withdrawals/               # 出金申請管理
        ├── page.tsx
        └── [id]/page.tsx
```

**拡張の原則**:
- サブスク機能追加時: `features/points/subscription.service.ts` を追加
- 投げ銭機能追加時: `features/points/tip.service.ts` を追加
- キャスト向け機能追加時: `liff/points/` ディレクトリを新設
- 既存構造を壊さずに拡張可能 [CA][DRY]

---

## 9. Phase 1実装時の注意事項

### 9.1 将来拡張を見越した設計

**Phase 1で実装する際に `user_id` に変更しておく**:
```sql
-- ✅ 推奨（将来のキャスト対応も考慮）
CREATE TABLE public.points_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id),  -- user_id
  account_type VARCHAR(50) NOT NULL DEFAULT 'organizer',     -- 将来: 'talent'
  balance INTEGER NOT NULL DEFAULT 0,
  ...
);

-- ❌ 避ける（後でリネームが必要）
CREATE TABLE public.points_accounts (
  organizer_id UUID NOT NULL UNIQUE,  -- 後で変更が大変
  ...
);
```

**理由**:
- カラム名変更は外部キー制約の再作成が必要
- RLSポリシーの書き換えが必要
- 既存データのマイグレーションが必要
- Phase 1で `user_id` にしておけば、将来は `account_type` で判別するだけ

### 9.2 transaction_type の設計

**Phase 1から拡張を見越した列挙型**:
```typescript
// types.ts
export type TransactionType =
  // Phase 1: 主催者向け
  | 'purchase'
  | 'consumption'
  | 'admin_grant'
  | 'admin_deduct'
  
  // Phase 2: ルール管理
  | 'monthly_bonus'
  | 'welcome_bonus'
  | 'referral_bonus'
  
  // 将来: キャスト向け（コメントアウトまたは後で追加）
  // | 'audition_reward'
  // | 'tip_received'
  // | 'tip_sent'
  // | 'withdrawal'
  // | 'withdrawal_fee'
```

**バリデーションは柔軟に**:
```typescript
// validation.ts
const ALLOWED_TRANSACTION_TYPES = [
  'purchase',
  'consumption',
  'admin_grant',
  'admin_deduct',
  'monthly_bonus',
  // 将来追加時はここに追記するだけ
] as const
```
