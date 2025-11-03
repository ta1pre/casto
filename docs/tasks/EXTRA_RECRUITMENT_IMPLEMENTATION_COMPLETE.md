# エキストラ募集機能 実装完了レポート

**完了日**: 2025-11-03  
**設計原則**: [SF][CA][DRY][REH]

---

## ✅ 実装完了内容

### Phase 1: データモデル実装

**マイグレーション**: `supabase/migrations/20251103210000_add_extra_recruitment_support.sql`

1. **auditionsテーブル拡張**
   - `project_type` に `extra` を追加（audition/job/extra）
   - `extra_details JSONB` カラム追加（種別ごとの拡張データ）
   - GINインデックス追加（JSONB検索の高速化）

2. **applicationsテーブル拡張**
   - `extra_application_data JSONB` カラム追加（応募時の種別固有データ）
   - GINインデックス追加

3. **audition_typesテーブル新規作成**
   - 種別マスタ（料金・表示名・有効/無効フラグ）
   - 管理者のみ更新可能（RLSポリシー）
   - 初期データ投入:
     - audition: 3,000pt
     - job: 5,000pt
     - extra: 10,000pt（デフォルト、アドミンで変更可能）

### Phase 2: 型定義・バリデーション更新

**型定義** (`packages/shared/src/types/`)
- `audition.ts`: `ProjectType` に `extra` 追加、`ExtraDetails` / `JobDetails` 型追加
- `auditionType.ts`: 新規作成（種別マスタ型）
- `application.ts`: `ExtraApplicationData` 型追加

**バリデーション** (`packages/shared/src/validators/`)
- `audition.ts`: `projectType` に `extra` 追加、`extraDetailsSchema` / `jobDetailsSchema` 追加
- `application.ts`: `extraApplicationDataSchema` 追加

### Phase 3: Workers API更新

**新規サービス・ルート**
- `apps/workers/src/features/audition-types/service.ts`: 種別マスタのCRUD
- `apps/workers/src/features/audition-types/routes.ts`: 種別API
  - `GET /api/v1/audition-types` - 有効な種別一覧（認証不要）
  - `GET /api/v1/audition-types/all` - 全種別（管理者のみ）
  - `PATCH /api/v1/audition-types/:id` - 種別更新（管理者のみ）

**既存サービス更新**
- `apps/workers/src/features/organizer/auditions/service.ts`
  - `toAudition()`: `extraDetails` フィールド追加
  - `createAudition()`: `extra_details` 保存対応
  - `updateAudition()`: `extra_details` 更新対応

**ルーティング追加**
- `apps/workers/src/app.ts`: `/api/v1/audition-types` ルート追加

### Phase 4: フォームUI実装

**オーディション新規作成フォーム** (`apps/web/src/app/organizer/auditions/new/page.tsx`)

1. **種別ラジオボタン拡張**
   - オーディション / 求人 / エキストラ募集

2. **動的セクション表示**
   - **ジャンル**: エキストラ以外で表示
   - **エキストラ専用項目**: 集合場所、想定人数
   - **求人専用項目**: 勤務地、雇用形態、給与

3. **extraDetails構築**
   - 種別に応じて適切な形式で送信

---

## 🎯 実装された機能

### 主催者（オーガナイザー）

1. **オーディション作成時**
   - 種別選択: オーディション / 求人 / エキストラ募集
   - 種別に応じた専用フィールド入力
   - ジャンルはエキストラでは非表示

2. **種別ごとの項目**
   - **エキストラ募集**: 集合場所、想定人数
   - **求人**: 勤務地、雇用形態、給与

### 管理者（アドミン）

1. **種別マスタ管理**
   - 全種別の料金を管理画面から変更可能
   - デフォルト: エキストラ10,000pt

---

## 📁 変更ファイル一覧

### マイグレーション
- ✅ `supabase/migrations/20251103210000_add_extra_recruitment_support.sql`

### 型定義・バリデーション
- ✅ `packages/shared/src/types/audition.ts`
- ✅ `packages/shared/src/types/auditionType.ts` (新規)
- ✅ `packages/shared/src/types/application.ts`
- ✅ `packages/shared/src/types/index.ts`
- ✅ `packages/shared/src/validators/audition.ts`
- ✅ `packages/shared/src/validators/application.ts`

### Workers API
- ✅ `apps/workers/src/features/audition-types/service.ts` (新規)
- ✅ `apps/workers/src/features/audition-types/routes.ts` (新規)
- ✅ `apps/workers/src/features/organizer/auditions/service.ts`
- ✅ `apps/workers/src/app.ts`

### フロントエンド
- ✅ `apps/web/src/app/organizer/auditions/new/page.tsx`

---

## 🚀 次のステップ（マイグレーション適用）

### 1. マイグレーション適用

```bash
# パスワードを環境変数に設定
export SUPABASE_DB_PASSWORD='your_password'

# マイグレーション適用
make db-apply

# 整合性確認
make db-check
```

### 2. Workers再デプロイ

```bash
# GitHub経由でCI/CD自動デプロイ
git add .
git commit -m "feat: add extra recruitment support"
git push origin develop
```

### 3. 動作確認

1. オーディション新規作成画面にアクセス
2. 「エキストラ募集」ラジオボタンが表示されることを確認
3. エキストラを選択すると専用項目が表示されることを確認
4. 作成してデータが正しく保存されることを確認

---

## 🔄 将来の拡張予定（未実装）

### Phase 6: 複数日程入力UI
- エキストラの開催日程を複数登録できるカレンダーUI
- 日程追加・削除機能

### Phase 7: 応募フロー最適化
- エキストラ応募時の簡易プロフィール表示
- 出演可能日程の選択UI

### Phase 8: 簡易一覧表示
- 主催者画面でエキストラ応募者を1行表示
- 既存プロフィール + 出演可能日程のみ表示

---

## 📊 技術的ポイント

### べき等性の保証
- マイグレーションは `DO $$ ... IF NOT EXISTS` で重複実行を防止
- 種別マスタの初期データは `ON CONFLICT ... DO UPDATE` で上書き

### JSONB活用
- 種別ごとの柔軟な拡張データをJSONBで管理
- GINインデックスで検索パフォーマンスを確保

### 動的フォーム
- 種別選択に応じてUIを動的に切り替え
- ジャンル表示の制御（エキストラでは非表示）

### 型安全性
- TypeScriptの型定義とZodバリデーションで堅牢性を確保
- camelCase ↔ snake_case変換を一元管理

---

## 設計原則の適用

- **[SF] Simple First**: JSONBで柔軟性を確保しつつ、必要最小限のカラム追加
- **[CA] Clean Architecture**: 機能ごとにディレクトリを分離（audition-types/）
- **[DRY] Don't Repeat Yourself**: 型定義・バリデーションを共通化
- **[REH] Robust Error Handling**: べき等性を保証し、エラー時の安全性を確保

---

**実装完了！** 次はマイグレーション適用とデプロイです 🚀
