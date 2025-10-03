# TODO リスト

## ✅ Phase 1: LINE認証実装（完了）

- **概要**: LINEミニアプリ経由でのユーザー認証と、Supabase `users` テーブルへの自動登録機能。
- **状態**: 完了済み。

---

## 🚀 Phase 2: プロフィール登録機能（設計・実装中）

- **目的**: タレント・モデルが自身のプロフィール情報を登録・管理し、審査に必要な完成度を可視化する。
- **現状**: UIコンポーネントは完成。型定義と完成度ロジックを整理し、バックエンド実装へ進む。

### 作業フロー概要

```
1. フロント型定義整理 → 2. DB設計・マイグレーション → 3. バックエンドAPI実装 → 4. フロント連携 → 5. 統合テスト
```

**設計方針**: 既存の users API と同じパターンを踏襲。フロント/バックは独立して型定義し、API仕様で整合性を保つ。

---

### Step 1: フロント型定義の整理

**目的**: フォーム実装に合わせた型定義に修正し、数値項目を適切な型に変更する。

#### 1-1. フォーム型の修正

- [ ] **`apps/web/src/app/liff/profile/_components/types.ts` の修正**
  - **作業内容**:
    - `ProfileFormData` から未使用フィールドを削除: `shoeSize`, `activityAreas`, `canMove`, `canStay`, `passportStatus`
    - **数値項目の型を `string` から `number | ''` に変更**: `height`, `weight`, `bust`, `waist`, `hip`, `followers`
      - 未入力時は空文字 `''` を許容（フォームの初期状態のため）
      - 入力後は `number` 型として扱う
    - 実際のフォーム入力に合わせた型定義に修正
  - **完了確認**: 
    - 全ステップコンポーネントで型エラーが出ないこと
    - `ProfileRegistrationForm.tsx` でコンパイルエラーがないこと
    - 数値項目が `number | ''` 型になっていること

- [ ] **共通型定義の作成 (`packages/shared/src/types/profile.ts`)**
  - **作業内容**:
    - API リクエスト/レスポンス用の型を定義
    - `TalentProfileInput` (POST/PUT リクエスト用)
    - `TalentProfileResponse` (GET レスポンス用、完成度情報含む)
    - `ProfileCompletionInfo` (完成度の構造体)
  - **完了確認**: 
    - フロント・バック両方から import できること
    - 型定義が `ProfileFormData` と互換性があること

#### 1-2. 完成度計算ロジックの整理

- [ ] **`profileCompletion.ts` の修正**
  - **作業内容**:
    - 未使用フィールド参照を削除
    - 現行フォーム項目のみで計算するロジックに変更
    - 各セクション判定基準を明確化（コメント追加）
  - **完了確認**: 
    - `calculateProfileCompletion()` が型エラーなく動作
    - テストデータで正しい完成度が計算されること

- [ ] **完成度計算ロジックの共通化 (`packages/shared/src/utils/profileCompletion.ts`)**
  - **作業内容**:
    - フロント/バック共通で使える計算関数を作成
    - `calculateCompletionRate(data: ProfileData): ProfileCompletionInfo`
  - **完了確認**: 
    - フロント・バックから同じロジックを参照できること
    - 同じデータで同じ結果が返ること

- [ ] **バリデーションロジックの作成 (`packages/shared/src/utils/profileValidation.ts`)**
  - **作業内容**:
    - プロフィールデータのバリデーション関数を作成
    - **必須項目チェック**: `stageName`, `gender`, `prefecture`
    - **数値範囲チェック**: 
      - `height`: 100〜250 cm
      - `weight`: 20〜200 kg
      - `bust`, `waist`, `hip`: 30〜200 cm
      - `followers`: 0 以上
    - **文字列長チェック**: `stageName` (1〜50文字), `achievements` (最大1000文字)
    - **形式チェック**: `birthdate` (YYYY-MM-DD または YYYY-MM または YYYY)
    - エラーメッセージを日本語で返す
  - **完了確認**: 
    - バリデーション関数が正しく動作すること
    - 適切なエラーメッセージが返ること

---

### Step 2: データベース設計・マイグレーション

**前提条件**: Step 1 の型定義が完了していること

#### 2-1. マイグレーションファイル作成

- [ ] **`supabase/migrations/YYYYMMDD_create_talent_profiles.sql` の作成**
  - **テーブル構造**:
    - `user_id` (uuid, FK to users.id, PK)
    - **基本情報**: `stage_name` (text, not null), `gender` (text, not null), `birthdate` (text), `prefecture` (text, not null), `occupation` (text)
    - **体型・経歴**: `height` (integer), `weight` (integer), `bust` (integer), `waist` (integer), `hip` (integer), `achievements` (text)
    - **所属**: `affiliation_type` (text), `agency` (text)
    - **SNS**: `twitter` (text), `instagram` (text), `tiktok` (text), `youtube` (text), `followers` (text)
    - **完成度**: `completion_rate` (smallint, default 0), `completion_sections` (jsonb, default '{}')
    - **システム**: `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now())
  - **制約・インデックス**:
    - PRIMARY KEY: `user_id`
    - FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE
    - INDEX: `created_at`, `completion_rate` (審査用)
  - **RLS (Row Level Security)**:
    - ユーザーは自分のプロフィールのみ参照・更新可能
  - **完了確認**: 
    - ローカルでマイグレーション適用成功
    - `\d talent_profiles` でテーブル構造確認

---

### Step 3: バックエンドAPI実装 (Cloudflare Workers)

**前提条件**: Step 1 の共通型定義と Step 2 の DB マイグレーションが完了していること

#### 3-1. プロフィールAPI機能実装

- [ ] **ディレクトリ構成作成 (`apps/workers/src/features/liff/profile/`)**
  - `types.ts`, `service.ts`, `routes.ts` を作成

- [ ] **`types.ts` - 型定義**
  - **作業内容**:
    - `packages/shared` から共通型を import
    - Workers 固有の型（Env, Context）を定義
  - **完了確認**: import エラーがないこと

- [ ] **`service.ts` - ビジネスロジック**
  - **実装する関数**:
    - `getTalentProfile(userId: string, supabase: SupabaseClient): Promise<TalentProfileResponse | null>`
    - `createTalentProfile(userId: string, data: TalentProfileInput, supabase: SupabaseClient): Promise<TalentProfileResponse>`
    - `updateTalentProfile(userId: string, data: Partial<TalentProfileInput>, supabase: SupabaseClient): Promise<TalentProfileResponse>`
  - **重要処理**:
    - 保存時に `packages/shared` のバリデーション関数でデータ検証
    - バリデーションエラー時は 400 レスポンスを返す
    - 保存時に `calculateCompletionRate()` を呼び出し、`completion_rate` と `completion_sections` を計算
    - データ型は既に `number` なので変換不要（フロントで対応済み）
  - **完了確認**: 
    - 各関数が単体で動作すること
    - Supabase へのクエリが正しいこと
    - バリデーションが正しく動作すること

- [ ] **`routes.ts` - エンドポイント定義**
  - **実装するエンドポイント**:
    - `GET /api/v1/liff/profile` - 自分のプロフィール取得
    - `POST /api/v1/liff/profile` - プロフィール新規作成
    - `PUT /api/v1/liff/profile` - プロフィール全体更新
    - `PATCH /api/v1/liff/profile` - プロフィール部分更新
  - **共通処理**:
    - LINE認証チェック（既存の `verifyLineToken` ミドルウェア利用）
    - エラーハンドリング（400, 404, 500）
  - **完了確認**: 
    - 各エンドポイントが定義されていること
    - ルーティングが正しいこと

- [ ] **`apps/workers/src/app.ts` にルート追加**
  - **作業内容**: `app.route('/api/v1/liff/profile', profileRoutes)`
  - **完了確認**: ビルドが通ること

---

### Step 3.5: フォームコンポーネントの改善

**前提条件**: Step 1 の型定義が完了していること

#### 3.5-1. 数値入力フィールドの改善

- [ ] **`DetailStep.tsx` と `SnsStep.tsx` の修正**
  - **作業内容**:
    - `Input` コンポーネントに `type="number"` と `inputMode="numeric"` を追加
    - `pattern="[0-9]*"` を追加（スマホで数字キーボードを表示）
    - `min`, `max` 属性で範囲制限
    - `onChange` で値を `number` 型に変換（空文字は `''` のまま）
  - **対象フィールド**: `height`, `weight`, `bust`, `waist`, `hip`, `followers`
  - **完了確認**: 
    - スマホで数字キーボードが表示されること
    - 型エラーがないこと
    - 範囲外の値が入力できないこと

#### 3.5-2. バリデーション組み込み

- [ ] **フォームバリデーションの実装**
  - **作業内容**:
    - `ProfileRegistrationForm.tsx` に `packages/shared` のバリデーション関数を import
    - `handleSubmit` 前にバリデーション実行
    - エラーがあれば送信せず、エラーメッセージを表示
    - 各ステップでもリアルタイムバリデーション（オプション）
  - **完了確認**: 
    - 必須項目未入力時にエラーが表示されること
    - 範囲外の数値入力時にエラーが表示されること
    - エラーメッセージが日本語で表示されること

---

### Step 4: フロントエンド連携

**前提条件**: Step 3 のバックエンドAPIが実装済みであること

#### 4-1. API通信層の実装

- [ ] **API クライアント作成 (`apps/web/src/shared/api/profile.ts`)**
  - **実装する関数**:
    - `fetchProfile(lineIdToken: string): Promise<TalentProfileResponse | null>`
    - `createProfile(lineIdToken: string, data: TalentProfileInput): Promise<TalentProfileResponse>`
    - `updateProfile(lineIdToken: string, data: Partial<TalentProfileInput>): Promise<TalentProfileResponse>`
  - **完了確認**: 型安全にAPI呼び出しができること

#### 4-2. フォームのAPI連携

- [ ] **`ProfileRegistrationForm.tsx` の修正**
  - **作業内容**:
    - `handleSubmit` 関数で API 呼び出しを実装
    - `useEffect` でプロフィール取得とフォーム初期化
    - 完成度をバックエンドから取得して表示
    - ローディング・エラー状態の管理
  - **完了確認**: 
    - プロフィール保存が動作すること
    - 既存プロフィールが正しく読み込まれること
    - 完成度が正しく表示されること

- [ ] **`FooterNavigation.tsx` の修正**
  - **作業内容**: バックエンドから取得した `completion_rate` を表示
  - **完了確認**: 正しい完成度が表示されること

---

### Step 5: 統合テスト・検証

**前提条件**: Step 4 まで完了していること

- [ ] **ローカル環境での動作確認**
  - [ ] LIFF アプリでプロフィール新規作成が成功する
  - [ ] 作成したプロフィールが DB に保存されている
  - [ ] プロフィール編集が正しく動作する
  - [ ] 完成度が正しく計算・表示される（フロント/バック一致）
  - [ ] 必須項目未入力時のバリデーションが動作する

- [ ] **開発環境へのデプロイ**
  - [ ] Workers のデプロイ成功
  - [ ] マイグレーション適用成功
  - [ ] LIFF 環境での動作確認

---

### 成功基準（Phase 2 完了条件）

- ✅ LIFFアプリからプロフィールを作成・更新できる
- ✅ Supabase `talent_profiles` にデータと完成度が保存される
- ✅ 既存プロフィールを読み込み、フォームに反映できる
- ✅ 完成度が正しく計算され、フロントに表示される
- ✅ フロント/バックで同じ完成度計算ロジックを使用している
- ✅ 型定義がフロント/バック間で統一されている

---

### Phase 2の範囲外（後日実装）

- Cloudflare R2 を利用した画像アップロード本実装
- 完成度履歴のバージョン管理や分析機能
- オーディション応募時のプロフィール未完成チェック
- プロフィール公開/非公開設定

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
