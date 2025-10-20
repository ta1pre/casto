# ポイント機能 仕様書

**策定日**: 2025-10-20  
**設計原則**: [SF][CA][DRY][REH][SFT]

---

## 1. 概要

主催者がオーディション応募者の詳細を閲覧する際、ポイントによる従量課金を実現。Stripe決済で購入→閲覧→消費のフローを管理。

**スコープ**:
- Phase 1（MVP）: ポイント購入、応募者閲覧課金、残高管理、取引履歴
- Phase 2: 定額プラン（見放題）、Admin管理
- Phase 3: サブスクリプション
- Phase 4（将来）: 投げ銭、ボーナス、失効

**設計原則（絶対厳守）**:
- **[SF] Simple First**: 常に最もシンプルな実装を選択
- **[DRY] Don't Repeat Yourself**: 重複コードは即座にリファクタリング
- **[CA] Clean Architecture**: 機能ごとに集約、散らばらない構成

---

## 2. ビジネスルール

### 2.1 閲覧課金

#### 閲覧単価の優先順位
1. **案件ごとの設定** (`auditions.viewing_point_cost`) - 最優先
2. **ジャンルごとの設定** (`audition_genres.viewing_point_cost`) - 次に適用
3. **デフォルト設定** (`system_settings.default_viewing_point_cost` = 100pt) - フォールバック

#### ジャンル別単価（例）
- 求人: 2,500pt/人
- 映画: 500pt/人
- アイドル: 800pt/人
- モデル: 1,000pt/人
- 俳優・女優: 1,200pt/人
- その他: NULL（デフォルト100pt使用）

#### 無料閲覧枠
- **案件ごとに設定可能**: `free_viewing_quota`（例: 10人まで無料）
- 11人目からポイント消費開始
- 0 = 無料枠なし、NULL = 無料枠なし

#### その他設定
- **初回閲覧時のみ消費**（`viewed_applications`で管理）
- **案件ごと設定**:
  - `viewing_point_cost`: 閲覧単価（NULL=ジャンル設定 or デフォルト）
  - `free_viewing_quota`: 無料閲覧枠（NULL or 0 = なし）
  - `max_viewing_points`: 上限（例: 30,000ptで見放題）
  - `unlimited_viewing`: true=完全無料閲覧

### 2.2 ポイント購入
- Stripe Checkoutで購入
- プラン例: 1,000pt=¥1,100 / 5,000pt=¥5,000 / 10,000pt=¥9,000 / 30,000pt=¥24,000
- Webhook (`checkout.session.completed`) で付与

---

## 3. データベース設計

### 3.1 新規テーブル

```sql
-- ポイントアカウント（ユーザーごと）
CREATE TABLE public.points_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  account_type VARCHAR(50) NOT NULL DEFAULT 'organizer', -- 'organizer' or 'talent'（将来拡張）
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 取引履歴
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.points_accounts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'consumption', 'admin_grant', etc.
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  related_application_id UUID REFERENCES public.applications(id),
  related_stripe_session_id VARCHAR(255),
  metadata JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ポイントプラン
CREATE TABLE public.points_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  price_jpy INTEGER NOT NULL,
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  discount_rate INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 閲覧済み管理
CREATE TABLE public.viewed_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  points_consumed INTEGER NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, application_id)
);
```

### 3.2 既存テーブル拡張

```sql
-- auditions テーブル拡張
ALTER TABLE public.auditions
  ADD COLUMN viewing_point_cost INTEGER,        -- 案件ごとの閲覧単価（NULL=ジャンル or デフォルト）
  ADD COLUMN free_viewing_quota INTEGER,        -- 無料閲覧枠（例: 10人まで無料）
  ADD COLUMN max_viewing_points INTEGER,        -- 上限ポイント（見放題判定）
  ADD COLUMN unlimited_viewing BOOLEAN NOT NULL DEFAULT false;

-- audition_genres テーブル拡張
ALTER TABLE public.audition_genres
  ADD COLUMN viewing_point_cost INTEGER;        -- ジャンル別閲覧単価（NULL=デフォルト使用）

-- 初期データ設定例
UPDATE public.audition_genres SET viewing_point_cost = 2500 WHERE slug = 'job';        -- 求人
UPDATE public.audition_genres SET viewing_point_cost = 500  WHERE slug = 'movie';      -- 映画
UPDATE public.audition_genres SET viewing_point_cost = 800  WHERE slug = 'idol';       -- アイドル
UPDATE public.audition_genres SET viewing_point_cost = 1000 WHERE slug = 'model';      -- モデル
UPDATE public.audition_genres SET viewing_point_cost = 1200 WHERE slug = 'actor';      -- 俳優・女優
-- その他はNULL（デフォルト100pt使用）
```

---

## 4. ディレクトリ構成

### 4.1 Backend (Workers)

```
apps/workers/src/features/
├── points/                          # 主催者向けポイント機能
│   ├── routes.ts                    # /api/v1/points/*
│   ├── service.ts
│   ├── stripe.service.ts
│   └── types.ts
└── admin/
    └── points/                      # Admin向けポイント管理
        ├── routes.ts                # /api/v1/admin/points/*
        ├── service.ts
        └── types.ts
```

### 4.2 Frontend (Next.js)

```
apps/web/src/app/
├── organizer/
│   ├── points/                      # ポイント購入・履歴
│   │   ├── page.tsx                 # 残高・購入導線
│   │   ├── purchase/page.tsx        # プラン選択
│   │   ├── history/page.tsx         # 取引履歴
│   │   └── _components/
│   │       ├── BalanceCard.tsx
│   │       ├── PlanSelector.tsx
│   │       └── TransactionList.tsx
│   └── auditions/[id]/
│       └── applications/[applicationId]/
│           ├── page.tsx             # 応募者詳細（閲覧課金）
│           └── _components/
│               ├── ViewingConfirmModal.tsx
│               └── InsufficientPointsModal.tsx
└── admin/
    └── points/                      # ポイント管理
        ├── page.tsx                 # 統計・アカウント一覧
        ├── accounts/[id]/page.tsx   # 個別詳細
        ├── plans/page.tsx           # プラン管理
        ├── settings/page.tsx        # デフォルト単価
        ├── genre-costs/page.tsx     # ジャンル別単価管理
        └── _components/
            ├── AccountList.tsx
            ├── TransactionHistory.tsx
            ├── PointGrantModal.tsx
            ├── PlanEditor.tsx
            ├── SettingsForm.tsx
            └── GenreCostEditor.tsx  # ジャンル別単価編集
```

---

## 5. API設計

### 5.1 主催者向け

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/v1/points/account` | 残高取得 |
| GET | `/api/v1/points/transactions` | 履歴一覧 |
| GET | `/api/v1/points/plans` | プラン一覧 |
| POST | `/api/v1/points/purchase` | Checkout作成 |
| POST | `/api/v1/points/check-viewing` | 閲覧可否 |
| POST | `/api/v1/points/consume-viewing` | ポイント消費 |

### 5.2 Admin向け

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/api/v1/admin/points/accounts` | 全アカウント |
| POST | `/api/v1/admin/points/grant` | 手動付与 |
| POST | `/api/v1/admin/points/deduct` | 手動減算 |
| GET | `/api/v1/admin/points/plans` | プラン管理 |
| POST | `/api/v1/admin/points/plans` | プラン作成 |
| PATCH | `/api/v1/admin/points/plans/:id` | プラン更新 |
| PATCH | `/api/v1/admin/points/settings` | デフォルト単価 |
| GET | `/api/v1/admin/points/genre-costs` | ジャンル別単価一覧 |
| PATCH | `/api/v1/admin/points/genre-costs/:id` | ジャンル別単価更新 |

### 5.3 Webhook

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | `/api/v1/webhook/stripe` | Stripe Webhook |

---

## 5.5. 閲覧課金ロジック詳細

### 閲覧可否チェックの処理フロー

```typescript
async function checkViewingEligibility(organizerId, applicationId) {
  // 1. オーディション情報取得（ジャンル情報も含む）
  const audition = await getAuditionWithGenre(applicationId)
  
  // 2. 見放題チェック
  if (audition.unlimited_viewing) {
    return { canView: true, pointsRequired: 0, reason: 'unlimited' }
  }
  
  // 3. 既に閲覧済みかチェック
  const alreadyViewed = await isAlreadyViewed(organizerId, applicationId)
  if (alreadyViewed) {
    return { canView: true, pointsRequired: 0, reason: 'already_viewed' }
  }
  
  // 4. 無料閲覧枠チェック
  if (audition.free_viewing_quota > 0) {
    const viewedCount = await getViewedCountForAudition(organizerId, audition.id)
    if (viewedCount < audition.free_viewing_quota) {
      return { canView: true, pointsRequired: 0, reason: 'free_quota' }
    }
  }
  
  // 5. 閲覧単価を決定（優先順位: 案件 > ジャンル > デフォルト）
  let pointCost = audition.viewing_point_cost  // 案件ごと設定
  
  if (pointCost === null) {
    // ジャンル設定を取得
    pointCost = audition.genre?.viewing_point_cost
    
    if (pointCost === null) {
      // デフォルト設定を使用
      pointCost = await getDefaultViewingCost()  // 100pt
    }
  }
  
  // 6. 残高チェック
  const balance = await getBalance(organizerId)
  
  // 7. 上限ポイントチェック（見放題判定）
  if (audition.max_viewing_points && balance >= audition.max_viewing_points) {
    return { canView: true, pointsRequired: 0, reason: 'max_reached' }
  }
  
  return {
    canView: balance >= pointCost,
    pointsRequired: pointCost,
    currentBalance: balance,
    reason: balance < pointCost ? 'insufficient_balance' : undefined
  }
}
```

### 閲覧単価決定の具体例

#### 例1: 求人オーディション（ジャンル: 求人 = 2,500pt）
```
案件設定: NULL
↓
ジャンル「求人」設定: 2,500pt
↓
結果: 2,500pt/人
```

#### 例2: 映画オーディション（ジャンル: 映画 = 500pt）+ 無料枠10人
```
案件設定: NULL
無料枠設定: 10人
既に閲覧済み: 8人
↓
無料枠残り: 2人（10 - 8）
↓
結果: 0pt（無料）
```

#### 例3: 特殊オーディション（案件ごと設定あり）
```
案件設定: 3,000pt
↓
結果: 3,000pt/人（ジャンル設定を上書き）
```

#### 例4: 11人目の閲覧（無料枠超過後）
```
無料枠設定: 10人
既に閲覧済み: 10人
↓
無料枠超過
↓
ジャンル「映画」設定: 500pt
↓
結果: 500pt/人
```

---

## 6. UI/UXフロー

### 6.1 主催者: 応募者閲覧

1. 応募者一覧 → 詳細ページ遷移
2. 初回閲覧: 確認モーダル表示
   - **無料枠内の場合**: 「無料閲覧（残り7人）」
   - **無料枠超過後**: 「消費ポイント: 500pt」「残高: 5,000pt → 4,500pt」
3. 残高不足: 購入誘導モーダル
   - 「必要: 500pt / 残高: 50pt」
   - 「購入」ボタン → `/organizer/points/purchase`
4. 閲覧後: 詳細表示
5. 再閲覧: 即座に表示（消費なし）

### 6.1.5 主催者: オーディション作成・編集

**ポイント設定セクション**（オプション展開可能）:

```
┌─ ポイント設定（オプション） ─────────────────────┐
│                                                  │
│ □ 閲覧単価を個別設定                             │
│   └→ [___] pt/人                                │
│      ℹ️ 未設定の場合、ジャンル設定またはデフォルト│
│        （このオーディションのジャンル: 映画 = 500pt）│
│                                                  │
│ 無料閲覧枠                                       │
│   [10] 人まで無料                                │
│   ℹ️ 最初のN人まではポイント消費なし             │
│      0 = 無料枠なし                              │
│                                                  │
│ □ 見放題設定                                     │
│   └→ [30000] pt以上で見放題                      │
│                                                  │
│ □ 完全無料（ポイント消費なし）                   │
│                                                  │
└──────────────────────────────────────────────┘
```

### 6.2 主催者: ポイント購入

1. `/organizer/points` で残高確認
2. 「購入」→ プラン選択
3. Stripe Checkout遷移
4. 決済完了 → 成功ページ
5. Webhook処理 → ポイント付与
6. 確認通知（メール+LINE）

### 6.3 Admin: 手動付与

1. `/admin/points` でアカウント選択
2. 「ポイント付与」モーダル
   - 付与数（正負）
   - 理由（必須）
3. 確定 → 取引記録
4. 成功通知

### 6.4 Admin: ポイント設定統合ダッシュボード

**場所**: `/admin/points`（メインダッシュボード）

```
┌─ ポイントシステム管理 ─────────────────────────────┐
│                                                    │
│ 📊 統計情報                                        │
│   ・アクティブアカウント: 120件                    │
│   ・今月の購入総額: ¥450,000                       │
│   ・今月の消費ポイント: 89,000pt                   │
│                                                    │
│ ⚙️ グローバル設定                                  │
│   ┌────────────────────────────────────────┐     │
│   │ デフォルト閲覧単価: [100] pt/人        │     │
│   │ ポイント機能: [✓ 有効]                 │     │
│   └────────────────────────────────────────┘     │
│                                                    │
│ 🏷️ ジャンル別単価（→ 詳細設定）                   │
│   ・求人: 2,500pt  ・映画: 500pt  ・アイドル: 800pt│
│                                                    │
│ 💳 ポイントプラン（→ 詳細管理）                    │
│   ・1,000pt: ¥1,100  ・5,000pt: ¥5,000            │
│   ・10,000pt: ¥9,000  ・30,000pt: ¥24,000         │
│                                                    │
│ 👥 アカウント管理（→ 一覧表示）                    │
│   ・手動付与/減算  ・取引履歴  ・残高確認          │
│                                                    │
└────────────────────────────────────────────────┘
```

### 6.5 Admin: ジャンル別単価設定

**場所**: `/admin/points/genre-costs`

```
┌─ ジャンル別閲覧単価設定 ─────────────────────────┐
│                                                  │
│ 💡 適用ルール:                                   │
│   1. 案件ごとの設定がある場合: その値を使用      │
│   2. ジャンル設定がある場合: その値を使用        │
│   3. どちらもない場合: デフォルト（100pt）       │
│                                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ジャンル      │ 閲覧単価   │ アクション      │ │
│ ├────────────────────────────────────────────┤ │
│ │求人          │ [2500] pt  │ デフォルトに戻す│ │
│ │映画          │ [500] pt   │ デフォルトに戻す│ │
│ │アイドル      │ [800] pt   │ デフォルトに戻す│ │
│ │モデル        │ [1000] pt  │ デフォルトに戻す│ │
│ │俳優・女優    │ [1200] pt  │ デフォルトに戻す│ │
│ │ダンサー      │ [   ] pt   │ ─              │ │
│ │歌手・ボーカル│ [   ] pt   │ ─              │ │
│ │声優          │ [   ] pt   │ ─              │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ ⚠️ 注意事項:                                     │
│   ・空欄にするとデフォルト値（100pt）が適用      │
│   ・既存の案件ごとの設定は上書きされません       │
│   ・変更は即座に反映されます                     │
└──────────────────────────────────────────────┘
```

### 6.6 Admin: 全ルール一覧ページ

**場所**: `/admin/points/rules/overview`

すべてのポイントルールを一箇所で確認・調整できる統合ページ

```
┌─ ポイントルール 完全ガイド ──────────────────────┐
│                                                  │
│ 📋 現在の設定状況                                │
│                                                  │
│ 1️⃣ デフォルト閲覧単価                            │
│    └→ 100pt/人                                  │
│    変更: /admin/points/settings                 │
│                                                  │
│ 2️⃣ ジャンル別閲覧単価                            │
│    ├ 求人: 2,500pt/人                           │
│    ├ 映画: 500pt/人                             │
│    ├ アイドル: 800pt/人                         │
│    └ その他: NULL（デフォルト適用）             │
│    変更: /admin/points/genre-costs              │
│                                                  │
│ 3️⃣ 案件ごとの設定（主催者が設定）                │
│    ├ 閲覧単価の個別設定                         │
│    ├ 無料閲覧枠（例: 10人まで無料）             │
│    ├ 見放題設定（上限ポイント）                 │
│    └ 完全無料フラグ                             │
│    変更: 主催者がオーディション作成・編集時に設定│
│                                                  │
│ 4️⃣ ポイントプラン                                │
│    ├ 1,000pt = ¥1,100                           │
│    ├ 5,000pt = ¥5,000                           │
│    └ ...                                        │
│    変更: /admin/points/plans                    │
│                                                  │
│ 5️⃣ システム設定                                  │
│    ├ ポイント機能ON/OFF                         │
│    └ Stripe連携設定                             │
│    変更: /admin/points/settings                 │
│                                                  │
│ 📊 適用優先順位の確認                            │
│    案件ごと設定 > ジャンル設定 > デフォルト設定  │
│                                                  │
└──────────────────────────────────────────────┘
```

---

## 7. 実装計画

### Phase 1: MVP（2週間）
- [ ] DBマイグレーション作成
- [ ] Workers API: アカウント・残高・取引履歴
- [ ] Stripe連携: Checkout・Webhook
- [ ] 主催者UI: 残高表示・購入導線
- [ ] 閲覧課金ロジック
- [ ] Admin: 手動付与

### Phase 2: 管理強化（1週間）
- [ ] Admin: プラン管理UI
- [ ] デフォルト単価設定
- [ ] 取引履歴詳細
- [ ] 通知連携

### Phase 3: 定額・最適化（1週間）
- [ ] 見放題設定UI
- [ ] レポート機能
- [ ] パフォーマンス最適化

### Phase 4: 将来拡張
- [ ] サブスク
- [ ] ボーナス
- [ ] 投げ銭

---

## 7.5. ポイントルール管理機能（拡張）

### 目的
Admin画面から柔軟なポイント付与ルールを設定可能にする。コード変更なしで新しいキャンペーンやボーナス施策を展開。

### ユースケース例
- 毎月1日に全主催者へ100pt付与（当月末まで有効）
- 新規登録ボーナス1,000pt付与（無期限）
- 誕生月に500pt付与（当月末失効）
- 前月購入額が10,000円以上で200pt付与
- 友達紹介で両者に500pt付与

### 追加テーブル

```sql
-- ポイント付与ルール管理
CREATE TABLE public.points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,                -- 'monthly_recurring', 'one_time', 'conditional'
  trigger_type VARCHAR(50) NOT NULL,             -- 'cron', 'event', 'manual'
  
  -- Cron設定
  cron_expression VARCHAR(100),                  -- '0 0 1 * *' (毎月1日0時)
  
  -- 付与設定
  points_amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  
  -- 有効期限設定
  expiration_type VARCHAR(50),                   -- 'end_of_month', 'days_from_grant', 'none'
  expiration_days INTEGER,
  
  -- 対象ユーザー
  target_user_type VARCHAR(50) NOT NULL,         -- 'all_organizers', 'specific_users', 'condition_based'
  target_condition JSONB,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ルール実行履歴
CREATE TABLE public.points_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.points_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_user_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  failed_count INTEGER NOT NULL,
  error_details JSONB
);

-- points_transactions に有効期限追加
ALTER TABLE public.points_transactions
  ADD COLUMN expires_at TIMESTAMPTZ;
```

### Cloudflare Workers Cron

```toml
# apps/workers/wrangler.toml
[triggers]
crons = ["0 0 1 * *"]  # 毎月1日0時（UTC）
```

### Admin UI

**場所**: `/admin/points/rules`

- ルール一覧・作成・編集・削除
- Cron式ビルダー（視覚的に設定）
- 実行履歴表示
- テスト実行機能

### 有効残高計算

```sql
-- 有効期限を考慮した残高
CREATE OR REPLACE FUNCTION get_valid_balance(account_id_param UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM points_transactions
  WHERE account_id = account_id_param
    AND (expires_at IS NULL OR expires_at > NOW())
$$ LANGUAGE sql STABLE;
```

---

## 7.6. 将来拡張: キャスト向けポイント（ギャラ/投げ銭）

### 概要
現在の設計は主催者向けポイントを前提としているが、少しの拡張でキャスト向けポイント（ギャラ/投げ銭）にも対応可能。

### 拡張パターン

#### パターン1: ギャラ（オーディション報酬）
```typescript
// オーディション合格時
await grantRewardToTalent({
  talentId: 'user-123',
  amount: 50000,  // 5万ポイント
  transactionType: 'audition_reward',
  relatedAuditionId: 'audition-456',
  metadata: {
    audition_title: '新人アイドル募集',
    reward_type: 'participation_fee'
  }
})
```

#### パターン2: 投げ銭
```typescript
// ファン → キャスト
await sendTip({
  fromUserId: 'fan-123',
  toUserId: 'talent-456',
  amount: 1000,
  message: '応援しています！'
})

// 内部処理:
// 1. ファン: -1,000pt
// 2. キャスト: +900pt（手数料10%控除）
// 3. プラットフォーム: +100pt（収益）
```

### 必要な変更

#### 1. テーブル拡張
```sql
-- organizer_id → user_id に変更
ALTER TABLE public.points_accounts
  RENAME COLUMN organizer_id TO user_id;

ALTER TABLE public.points_accounts
  ADD COLUMN account_type VARCHAR(50) NOT NULL DEFAULT 'organizer';

-- transaction_type 拡張
-- 既存: 'purchase', 'consumption', 'admin_grant', 'monthly_bonus'
-- 追加: 'audition_reward', 'tip_received', 'tip_sent', 'withdrawal', 'withdrawal_fee'
```

#### 2. 出金管理
```sql
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount INTEGER NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  bank_name VARCHAR(255) NOT NULL,
  branch_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 3. API追加（将来）
```
キャスト向け:
  GET    /api/v1/talent/points/balance
  GET    /api/v1/talent/points/transactions
  POST   /api/v1/talent/points/withdraw
  POST   /api/v1/talent/points/bank-accounts

投げ銭:
  POST   /api/v1/talent/tip
  GET    /api/v1/talent/tips/received

Admin:
  GET    /api/v1/admin/points/withdrawals
  PATCH  /api/v1/admin/points/withdrawals/:id
  GET    /api/v1/admin/points/revenue
```

#### 4. UI追加（将来）
```
apps/web/src/app/liff/
└── points/
    ├── page.tsx                  # 残高・履歴
    ├── withdraw/page.tsx         # 出金申請
    └── bank-accounts/page.tsx    # 銀行口座管理

apps/web/src/app/admin/
└── points/
    └── withdrawals/              # 出金申請管理
        └── page.tsx
```

### 拡張の容易さ
- **データ構造**: カラム名変更のみ（`organizer_id` → `user_id`）
- **API**: transaction_type 追加で対応可能
- **UI**: 新規ディレクトリ追加、既存に影響なし
- **タイミング**: Phase 1実装時に `user_id` に変更しておけば、将来スムーズに拡張可能

---

## 8. セキュリティ

- RLS: ユーザーは自分のアカウントのみ（将来のキャスト対応も考慮）
- Webhook署名検証（Stripe）
- 二重消費防止（UNIQUE制約）
- 監査ログ（全取引記録、`points_transactions`）
- 出金申請の二段階承認（将来）
- 銀行口座情報の暗号化（将来）

---

## 9. 設計の柔軟性まとめ

### ✅ カスタマイズ可能な項目

**Admin画面で調整可能**:
- デフォルト閲覧単価（`system_settings`）
- 案件ごとの閲覧単価（`auditions.viewing_point_cost`）
- 案件ごとの見放題設定（`unlimited_viewing`）
- ポイントプラン（価格・ポイント数）
- ポイント機能のON/OFF（`points_feature_enabled`）
- ポイント付与ルール（Cron/イベント/条件）

**コード変更不要で追加可能**:
- 新しいポイント付与ルール（毎月ボーナス、キャンペーンなど）
- 新しいプラン（価格・ポイント数）
- 新しい付与タイミング（Cron式設定）

### ✅ 将来拡張への対応

**Phase 1で準備すること**:
- `organizer_id` → `user_id` へのカラム名変更
- `account_type` カラム追加（'organizer' / 'talent'）
- `transaction_type` の拡張を見越した設計

**追加で必要になるもの**:
- 出金申請・銀行口座管理（キャスト向け）
- Stripe Connect or 銀行API連携
- プラットフォーム収益管理
- 手数料設定

**拡張の容易さ**: データ構造はほぼそのまま、APIはtransaction_type追加のみ、UIは新規追加で既存に影響なし [SF][CA][DRY]
