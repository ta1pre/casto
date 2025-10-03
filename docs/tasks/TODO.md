# TODO リスト

## ✅ Phase 1: LINE認証実装（完了）

- **概要**: LINEミニアプリ経由でのユーザー認証と、Supabase `users` テーブルへの自動登録機能。
- **状態**: 完了済み。

---

## 🚀 Phase 2: プロフィール登録機能（実装中）

- **目的**: タレント・モデルがプロフィール情報を登録し、審査に必要な完成度を可視化する。
- **現状**: 共通パッケージ `@casto/shared` を導入し、`users` 機能と `apps/web/src/app/test/` のテストハーネスを共通型ベースへ移行済み。
- **設計方針**: 共有型・ユーティリティは `packages/shared/` で管理し、Workers / Web ともに同一型を参照する。[SF][DRY]

### 作業フロー

```
0. 共通基盤整備（完了） → 1. プロフィール型整備 → 2. DBマイグレーション → 3. Workers API → 4. Web連携 → 5. テスト
```

---

### Step 0: 共通基盤整備（完了）

- [x] **`packages/shared/` のセットアップ** (`package.json`, `tsconfig.json`, `src/index.ts`)[SF]
- [x] **ユーザー共通型の定義 (`packages/shared/src/types/user.ts`)** – `UserResponse`, `UsersListResponse`, `UsersStats` などを追加。[CA]
- [x] **ユーティリティ整備 (`packages/shared/src/utils/user.ts`)** – `serializeUserResponse()`, `buildUsersListResponse()` などを実装。[DRY]
- [x] **依存・パス設定** – `apps/web` / `apps/workers` の `package.json` と `tsconfig.json` を更新し、`npm install` 実施。[CA]
- [x] **Users 機能の共通化リファクタ** – Workers ルートと Web テストページを共通型に合わせて更新。[SF]
- [x] **Supabase スキーマ運用ガイド整備** – `docs/setup/SUPABASE_SCHEMA_MANAGEMENT.md` を作成し、`supabase/` 配下の役割を定義。[SD]
- [x] **Workers 型の共通化** – `apps/workers/src/types/` から `SupabaseUserRow` を削除し、`@casto/shared` を参照する構成へ統一。[DRY]
- [x] **ドキュメント全体整理** – `README.md`、`docs/README.md`、`docs/ARCHITECTURE.md` を最新構成（packages/shared、test ディレクトリのリファレンス化）に合わせて刷新し、setup 配下とのリンクを整備。[TR][CA]

---

### Step 1: プロフィール型・フロント整備

- [ ] **`apps/web/src/app/liff/profile/_components/types.ts` の整理** – 未使用フィールド削除、数値項目を `number | null` へ移行。[SF]
- [ ] **`packages/shared/src/types/profile.ts` 作成** – `TalentProfileInput`, `TalentProfileResponse`, `ProfileCompletionInfo` を定義。[DRY]
- [ ] **完成度ロジックの共通化 (`packages/shared/src/utils/profileCompletion.ts`)** – `calculateTalentProfileCompletion()` を実装し、重複を排除。[DRY]
- [ ] **バリデーション共通化 (`packages/shared/src/utils/profileValidation.ts`)** – 数値範囲・必須項目チェックを実装し、日本語メッセージを返す。[REH]
- [ ] **既存フォームでの新型適用 (`ProfileRegistrationForm.tsx`)** – 型更新に追従し型エラーを解消。[ISA]

---

### Step 2: データベース設計・マイグレーション

- [ ] **マイグレーションファイル作成 (`supabase/migrations/YYYYMMDD_create_talent_profiles.sql`)** – `talent_profiles` テーブルを定義し、必要なインデックスと RLS を設定。[CA]
- [ ] **ローカル適用テスト** – `supabase db reset` で適用し、`\d talent_profiles` で構造確認。[TDT]
- [ ] **ドキュメント更新 (`MIGRATION_GUIDE.md`)** – マイグレーション手順を追記。[SD]

---

### Step 3: Workers 側プロフィール API

- [ ] **ディレクトリ作成 (`apps/workers/src/features/liff/profile/`)** – `types.ts`, `service.ts`, `routes.ts` を追加。[CA]
- [ ] **`service.ts` 実装** – `getTalentProfile()`, `upsertTalentProfile()`, `calculateCompletion()` を実装し、共通バリデーション/完成度ロジックを利用。[DRY]
- [ ] **`routes.ts` 実装** – `GET`/`POST`/`PUT`/`PATCH` `/api/v1/liff/profile` を定義し、`verifyLineToken` を適用。エラーハンドリング追加。[REH]
- [ ] **`app.ts` ルート登録** – `app.route('/api/v1', profileRoutes)` を追記し、型チェックを通す。[ISA]
- [ ] **ユニットテスト/モック** – `vitest` で service 関数を検証。（追加予定）[TDT]

---

### Step 4: Web 側プロフィール連携

- [ ] **API層作成 (`apps/web/src/shared/api/profile.ts`)** – `fetchProfile()`, `saveProfile()` などを実装し、`User` と同様のフェッチパターンを利用。[CA]
- [ ] **データフック実装 (`apps/web/src/app/liff/profile/_hooks/useProfileData.ts`)** – 取得・保存・状態管理を共通化。[SF]
- [ ] **`ProfileRegistrationForm.tsx` の接続** – 保存/更新フロー、完了時リフレッシュ、エラー表示を実装。[REH]
- [ ] **ステップフォームの改善 (`DetailStep.tsx`, `SnsStep.tsx`)** – 数値入力に `type='number'` 等を設定し、共通バリデーションを連携。[ISA]
- [ ] **完成度ビューの更新** – バックエンドから返却された `completion_rate` を UI に反映。[CA]

---

### Step 5: 統合テスト・検証

- [ ] **ローカル統合テスト**
  - [ ] LIFF からプロフィール新規作成/更新が成功。
  - [ ] Supabase に保存されたレコードと完成度が期待値通り。
  - [ ] フロント/バックで同じ完成度ロジックを参照していることを確認。
- [ ] **開発環境検証**
  - [ ] Cloudflare Workers をデプロイし、`/api/v1/liff/profile` が動作。
  - [ ] マイグレーションを適用し、RLS を確認。
  - [ ] LIFF 実機での確認を実施。

---

## 📋 Phase 3: オーディション・応募機能（未着手）

- **概要**: 企業がオーディション案件を作成し、タレントが応募する機能。
- **状態**: 未着手。

---

## 📝 参考ドキュメント

- [アーキテクチャ](../ARCHITECTURE.md)
- [開発ルール](../DEVELOPMENT_RULES.md)
- [重要ルール](../CRITICAL_RULES.md)
- [LINE認証実装詳細](./tasksarchive/LINE_AUTH_IMPLEMENTATION.md)
- **既存実装の参考**: `apps/web/src/app/test/`, `apps/workers/src/features/users/`
