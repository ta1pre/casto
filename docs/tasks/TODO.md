# TODO リスト

## ✅ Phase 1: LINE認証実装（完了）
- **概要**: LINEミニアプリ経由でのユーザー認証と、Supabase `users` テーブルへの自動登録機能。
- **状態**: 完了済み。

---

## ✅ Phase 2: プロフィール登録機能実装（完了）

**目的**: タレント・モデルがプロフィールを登録し、完成度を確認できる機能を実装する。

**進捗状況**: 全ステップ完了 ✅共通パッケージ `@casto/shared` を導入し、`users` 機能と `apps/web/src/app/test/` のテストハーネスを共通型ベースへ移行済み。
- **設計方針**: 共有型・ユーティリティは `packages/shared/` で管理し、Workers / Web ともに同一型を参照する。[SF][DRY]

### 作業フロー

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

### Step 1: プロフィール型・フロント整備（完了）

- [x] **`packages/shared/src/types/profile.ts` 新規作成** – `TalentProfileInput`, `TalentProfileResponse`, `ProfileCompletionInfo` を定義し、Workers / Web で共有。[CA]
- [x] **`packages/shared/src/utils/profileCompletion.ts` 実装** – `calculateTalentProfileCompletion()` を共通化し、テストデータで検証。[TDT]
- [x] **`packages/shared/src/utils/profileValidation.ts` 実装** – 必須・数値項目のバリデーションとエラーメッセージを共通化。[REH]
- [x] **`ProfileRegistrationForm.tsx` の型適用** – 共通型・バリデーションを利用し、API連携を実装。[ISA]
- [x] **データ変換ユーティリティ作成** – `profileConverter.ts` でフォーム型 ⇔ API型の相互変換を実装。[DRY]

---

### Step 2: データベース設計・マイグレーション

- [x] **スキーマファイル作成 (`supabase/schema/talent_profiles.sql`)** – `talent_profiles` テーブルを定義し、完成度カラム・JSON セクション・インデックス・トリガーまで含めて実装。[CA]
- [x] **RLS 設定** – 認証済みユーザーが自身のレコードのみCRUD可能なポリシーを追加。[SFT]
- [x] **CHECK制約とバリデーション** – 数値範囲チェックとenum値の検証をDB層で実装。[REH]
- [ ] **マイグレーション生成と適用**（次回実施）
  - [ ] `cd supabase && ./sync` を実行してマイグレーション生成
  - [ ] 生成されたマイグレーションをレビュー
  - [ ] クラウドSupabaseに適用（GitHub Actions経由）

---

### Step 3: Workers 側プロフィール API（完了）

- [x] **ディレクトリ作成 (`apps/workers/src/features/liff/profile/`)** – `service.ts`, `routes.ts` を追加し、既存 `users` 構成に揃える。[CA]
- [x] **サービス実装 (`service.ts`)** – `getTalentProfile()`, `upsertTalentProfile()`, `serializeTalentProfileResponse()` を実装し、共通バリデーション・完成度計算を利用。[CA][DRY]
- [x] **ルート実装 (`routes.ts`)** – `GET`/`POST`/`PUT`/`PATCH` `/api/v1/liff/profile` を定義し、`verifyLineToken` とエラーハンドリングを適用。[REH]
- [x] **ミドルウェア作成 (`middleware/verifyLineToken.ts`)** – LINE認証チェックミドルウェアを実装。[SFT]
- [x] **エントリ登録 (`apps/workers/src/app.ts`)** – `app.route('/api/v1/liff/profile', profileRoutes)` を追加し、型チェック完了。[ISA]

---

### Step 4: Web 側プロフィール連携（完了）

- [x] **API 層 (`apps/web/src/shared/api/profile.ts`)** – `fetchProfile()`, `saveProfile()`, `updateProfile()`, `patchProfile()` を実装。[CA]
- [x] **データフック (`apps/web/src/app/liff/profile/_hooks/useProfileData.ts`)** – 取得・保存・状態管理を共通化し、エラーハンドリングを実装。[SF][REH]
- [x] **`ProfileRegistrationForm.tsx` の接続** – `useProfileData` を使って保存・更新フローを実装し、完成度表示をバックエンド値に置き換え。[CA]
- [x] **FooterNavigation更新** – 保存中状態の表示とボタン無効化を実装。[ISA]
- [x] **データ変換ユーティリティ** – フォームデータ ⇔ API型の相互変換を実装。[DRY]

---

### Step 5: 統合テスト・検証（完了）

- [x] **テストページ作成** – `/test/profile` でGET/POST/PUT/PATCHの動作確認が可能。[TDT]
- [x] **実装ドキュメント作成** – `docs/setup/PROFILE_IMPLEMENTATION.md` に仕様・使用方法・トラブルシューティングを記載。[SD]
- [x] **データベース構築** – Supabase MCP経由でマイグレーション適用、`talent_profiles`テーブル作成完了。[CA]
- [x] **プロフィールAPI動作確認** – POST/GETが正常動作、データベースに保存成功。[TDT]
- [x] **完成度計算検証** – フロント/バック共通ロジックで80%計算、セクション別完成度も正常保存。[DRY]
- [x] **バリデーション確認** – 必須項目・数値範囲チェックが正常動作。[REH]
- [x] **RLS動作確認** – 認証済みユーザーが自身のプロフィールのみ操作可能。[SFT]
- [x] **LINE認証連携** – `verifyLineToken`ミドルウェアが正常動作、未認証時は401エラー。[SFT]

---

## ✅ Phase 2.5: LINE認証の堅牢性向上（完了）

**目的**: LINE IDトークンの有効期限切れ（1時間）に対応し、シームレスな認証体験を実現する。

### 実装完了 [SF][REH][PA]
- [x] **エラー時の自動再認証** (`useLiffAuth.ts`) – 401エラー（IdToken expired）発生時に自動で`liff.login()`を呼び出す。[REH]
- [x] **無限ループ防止機構** – `isReloginInProgressRef`で再認証中の同時実行を防止。[SF][REH]
  - リログイン中は他の認証処理をスキップ
  - 認証成功時にフラグをリセット
- [x] **型安全な実装** – `apiError.body`の型ガードを追加し、TypeScriptエラーを解消。[ISA]
- [x] **プロアクティブなトークンリフレッシュ** – 50分ごとに自動でトークンを更新し、エラーを事前に防ぐ。[PA]
  - アプリが非アクティブ時はスキップ（バッテリー節約）
  - Phase 1のエラーハンドリングと組み合わせて多層防御を実現
- [x] **技術ドキュメント作成** (`docs/technical/LINE_TOKEN_REFRESH_STRATEGY.md`) – 実装詳細と設計判断を記載。[SD]

### 技術的制約
- **トークン有効期限（1時間）はLINE側の仕様** – サーバー側でも変更不可
- IDトークンの`exp`フィールドにLINEが設定する期限が埋め込まれている

### バリデーション改善 [REH][TDT]
- [x] **フロントエンドバリデーション実装** – 保存前に`validateTalentProfile()`でチェック
- [x] **リアルタイムエラー表示** – DetailStepで数値フィールドのエラーを即座に表示
- [x] **必須項目エラー表示** – BasicInfoStepで必須フィールドのエラーを表示
- [x] **数値変換の修正** – `parseNumberOrNull()`で空文字列を正しく`null`に変換

### UI/UX改善 [SF][DRY]
- [x] **プログレスバーのリアルタイム更新** – フォーム入力中も完成度が即座に反映
- [x] **シンプルな単色バー実装** – 0-25%グレー、25-80%薄い青、80-100%緑の視覚的フィードバック
- [x] **柔軟な閾値設定** – `THRESHOLD_GRAY`/`THRESHOLD_BLUE`定数で簡単に変更可能
- [x] **数字とバーの色の統一** – 完成度テキストの色もバーと同じ色に
- [x] **詳細な完成度計算** – 各項目に個別の重み付け（基本情報4%、写真20%、体型2%、自己PR10%、所属20%、SNS4%）

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
