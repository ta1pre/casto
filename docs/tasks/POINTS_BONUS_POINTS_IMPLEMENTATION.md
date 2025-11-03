# ポイントプラン - おまけポイント機能実装完了

**実装日**: 2025-11-03  
**設計原則**: [SF][CA][DRY][REH]

---

## 概要

ポイントプランの割引率（`discount_rate`）を廃止し、代わりに「おまけポイント（`bonus_points`）」機能を実装しました。

### 変更内容
- **旧仕様**: 割引率（%）による価格割引表示
- **新仕様**: おまけポイント（任意、0以上の整数）による追加ポイント付与

### ビジネスロジック
- プラン購入時に基本ポイント + おまけポイントを付与
- 例: 5,000pt購入 + 500ptおまけ = 合計5,500pt付与
- おまけポイントは任意設定（0 = おまけなし）

---

## 実装内容

### 1. マイグレーション

**ファイル**: `supabase/migrations/20251103000000_update_points_plans_bonus_points.sql`

```sql
-- bonus_pointsカラム追加（デフォルト0、任意のおまけポイント）
ALTER TABLE public.points_plans ADD COLUMN bonus_points INTEGER NOT NULL DEFAULT 0;

-- discount_rateカラム削除（旧仕様、不要）
ALTER TABLE public.points_plans DROP COLUMN discount_rate;
```

**適用方法**:
```bash
export SUPABASE_DB_PASSWORD='your_password'
make db-apply
```

---

### 2. 共有型定義更新

**ファイル**: `packages/shared/src/types/points.ts`

```typescript
export interface PointsPlan {
  id: string
  name: string
  points: number
  price_jpy: number
  stripe_product_id?: string | null
  stripe_price_id?: string | null
  bonus_points: number  // ← 変更: discount_rate → bonus_points
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}
```

**ファイル**: `packages/shared/src/validators/points.ts`

```typescript
export const createPointsPlanSchema = z.object({
  // ...
  bonus_points: z
    .number()
    .int('おまけポイントは整数である必要があります')
    .min(0, 'おまけポイントは0以上である必要があります')
    .optional()
    .default(0),
  // ...
})
```

---

### 3. Workers API更新

**ファイル**: `apps/workers/src/features/admin/points/service.ts`

```typescript
export async function createPlan(
  supabase: SupabaseClient,
  plan: {
    name: string
    points: number
    price_jpy: number
    stripe_product_id?: string
    stripe_price_id?: string
    bonus_points?: number  // ← 変更
    display_order?: number
  }
): Promise<PointsPlan>
```

---

### 4. Admin UI更新

**ファイル**: `apps/web/src/app/admin/points/plans/page.tsx`

#### プラン一覧表示
```typescript
{plan.bonus_points && plan.bonus_points > 0 && (
  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
    +{plan.bonus_points} pt おまけ
  </span>
)}
```

#### プラン作成・編集フォーム
```typescript
<div>
  <label className="block text-sm font-medium mb-1">おまけポイント（任意）</label>
  <input
    type="number"
    value={bonusPoints}
    onChange={(e) => setBonusPoints(e.target.value)}
    min="0"
    className="w-full border rounded px-3 py-2"
    placeholder="0"
  />
</div>
```

---

### 5. 主催者UI更新

**ファイル**: `apps/web/src/app/organizer/points/purchase/page.tsx`

#### おまけポイントバッジ
```typescript
{plan.bonus_points && plan.bonus_points > 0 && (
  <div className="absolute top-4 left-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-xs font-bold rounded-r-lg">
    +{plan.bonus_points} pt おまけ
  </div>
)}
```

#### 特典表示
```typescript
{plan.bonus_points && plan.bonus_points > 0 && (
  <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-sm text-green-800 font-semibold">
      🎁 おまけポイント +{plan.bonus_points.toLocaleString()} pt
    </p>
    <p className="text-xs text-green-700 mt-1">
      合計 {(plan.points + plan.bonus_points).toLocaleString()} pt が付与されます
    </p>
  </div>
)}
```

---

## 変更ファイル一覧

### マイグレーション
- `supabase/migrations/20251103000000_update_points_plans_bonus_points.sql` - 新規作成

### 共有型・バリデーション
- `packages/shared/src/types/points.ts` - `PointsPlan.bonus_points` 追加
- `packages/shared/src/validators/points.ts` - `bonus_points` バリデーション追加

### Workers API
- `apps/workers/src/features/admin/points/service.ts` - `createPlan()` 引数更新

### フロントエンド
- `apps/web/src/app/admin/points/plans/page.tsx` - Admin UI更新
- `apps/web/src/app/organizer/points/purchase/page.tsx` - 主催者UI更新

### ドキュメント
- `docs/tasks/TODO.md` - タスク更新
- `docs/tasks/POINTS_FEATURE_SPECIFICATION.md` - 仕様書更新
- `docs/tasks/POINTS_DIRECTORY_STRUCTURE.md` - 型定義更新
- `docs/tasks/POINTS_BONUS_POINTS_IMPLEMENTATION.md` - 実装完了レポート（本ファイル）

---

## 動作確認手順

### 1. マイグレーション適用
```bash
export SUPABASE_DB_PASSWORD='your_password'
make db-apply
make db-check  # 整合性確認
```

### 2. Admin画面でプラン作成
1. `/admin/points/plans` にアクセス
2. 「+ 新規プラン作成」をクリック
3. 以下を入力:
   - プラン名: 「スタンダードプラン」
   - ポイント数: 5000
   - 価格（円）: 5000
   - おまけポイント（任意）: 500
   - 表示順: 1
4. 「作成」をクリック
5. プラン一覧に「+500 pt おまけ」バッジが表示されることを確認

### 3. 主催者画面でプラン表示確認
1. `/organizer/points/purchase` にアクセス
2. 作成したプランが表示されることを確認
3. 「+500 pt おまけ」バッジが表示されることを確認
4. 特典欄に「🎁 おまけポイント +500 pt」「合計 5,500 pt が付与されます」が表示されることを確認

---

## 今後の拡張

### Phase 2: Stripe連携
- Webhook処理で `bonus_points` を含めた合計ポイントを付与
- `points_transactions` に基本ポイントとおまけポイントを分けて記録（オプション）

### Phase 3: キャンペーン機能
- 期間限定でおまけポイントを増量
- 特定条件（初回購入、誕生月など）で追加ボーナス

---

## 設計原則の適用

- **[SF] Simple First**: 割引率の複雑な計算を排除し、シンプルな加算方式に
- **[CA] Clean Architecture**: 機能ごとに集約、ファイル配置を統一
- **[DRY] Don't Repeat Yourself**: 型定義・バリデーションを共通化
- **[REH] Robust Error Handling**: バリデーションで0以上の整数を保証

---

## 完了

✅ すべての実装が完了し、動作確認可能な状態です。
