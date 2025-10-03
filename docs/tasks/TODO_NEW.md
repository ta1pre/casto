# TODO リスト

## ✅ Phase 1: LINE認証実装（完了）

- **概要**: LINEミニアプリ経由でのユーザー認証と、Supabase `users` テーブルへの自動登録機能。
- **状態**: 完了済み。

---

## 🚀 Phase 2: プロフィール登録機能（設計・実装中）

- **目的**: タレント・モデルが自身のプロフィール情報を登録・管理し、審査に必要な完成度を可視化する。
- **現状**: UIコンポーネントは完成。型定義を整理し、バックエンド実装へ進む。
- **設計方針**: 既存の users API（`/api/v1/users`）と同じパターンを踏襲。

### 作業フロー

```
1. フロント型整理 → 2. DB設計 → 3. バックエンドAPI → 4. フロント連携 → 5. テスト
```

---

### Step 1: フロント型定義の整理

#### 1-1. `ProfileFormData` の修正

- [ ] **`apps/web/src/app/liff/profile/_components/types.ts`**
  - **削除するフィールド**: `shoeSize`, `activityAreas`, `canMove`, `canStay`, `passportStatus`
  - **型変更（string → number | ''）**: `height`, `weight`, `bust`, `waist`, `hip`, `followers`
  - **完了確認**: 全コンポーネントでコンパイルエラーなし

#### 1-2. `INITIAL_FORM_DATA` の修正

- [ ] **`apps/web/src/app/liff/profile/_components/constants.ts`**
  - **削除**: 未使用フィールドの初期値
  - **完了確認**: 型エラーなし

#### 1-3. 完成度ロジックの修正

- [ ] **`apps/web/src/app/liff/profile/_components/profileCompletion.ts`**
  - **削除**: 未使用フィールドの参照（`shoeSize`, `activityAreas` など）
  - **完了確認**: 型エラーなし、テストデータで正しい計算結果

---

### Step 2: データベース設計・マイグレーション

#### 2-1. マイグレーションファイル作成

- [ ] **`supabase/migrations/YYYYMMDD_create_talent_profiles.sql`**
  - **テーブル構造**:
    ```sql
    CREATE TABLE talent_profiles (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      -- 基本情報
      stage_name text NOT NULL,
      gender text NOT NULL,
      birthdate text,  -- YYYY-MM-DD形式（不完全も許容）
      prefecture text NOT NULL,
      occupation text,
      -- 体型・経歴
      height integer,
      weight integer,
      bust integer,
      waist integer,
      hip integer,
      achievements text,
      -- 所属
      affiliation_type text,
      agency text,
      -- SNS
      twitter text,
      instagram text,
      tiktok text,
      youtube text,
      followers integer,
      -- 完成度
      completion_rate smallint DEFAULT 0,
      completion_sections jsonb DEFAULT '{}',
      -- システム
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE INDEX idx_talent_profiles_completion ON talent_profiles(completion_rate);
    CREATE INDEX idx_talent_profiles_created_at ON talent_profiles(created_at);
    ```
  - **RLS設定**: ユーザーは自分のプロフィールのみ参照・更新可能
  - **完了確認**: ローカルで適用成功、`\d talent_profiles` で確認

---

### Step 3: バックエンドAPI実装

**参考**: 既存の `apps/workers/src/features/users/` の実装パターンを踏襲

#### 3-1. ディレクトリ・ファイル作成

- [ ] **`apps/workers/src/features/liff/profile/` 配下**
  - `types.ts` - 型定義
  - `service.ts` - ビジネスロジック
  - `routes.ts` - エンドポイント

#### 3-2. 型定義

- [ ] **`apps/workers/src/features/liff/profile/types.ts`**
  ```typescript
  export interface TalentProfileInput {
    stageName: string
    gender: string
    birthdate?: string
    prefecture: string
    occupation?: string
    height?: number
    weight?: number
    bust?: number
    waist?: number
    hip?: number
    achievements?: string
    affiliationType?: string
    agency?: string
    twitter?: string
    instagram?: string
    tiktok?: string
    youtube?: string
    followers?: number
  }

  export interface TalentProfileRow extends TalentProfileInput {
    user_id: string
    completion_rate: number
    completion_sections: {
      basic: boolean
      detail: boolean
      affiliation: boolean
      sns: boolean
    }
    created_at: string
    updated_at: string
  }
  ```
  - **完了確認**: コンパイルエラーなし

#### 3-3. サービスロジック

- [ ] **`apps/workers/src/features/liff/profile/service.ts`**
  - **関数**: 
    - `getTalentProfile(userId, supabase)` - プロフィール取得
    - `upsertTalentProfile(userId, data, supabase)` - 作成/更新
    - `calculateCompletion(data)` - 完成度計算
  - **バリデーション**: 必須項目チェック、数値範囲チェック
  - **完了確認**: 各関数が動作

#### 3-4. ルート定義

- [ ] **`apps/workers/src/features/liff/profile/routes.ts`**
  - `GET /api/v1/liff/profile` - プロフィール取得
  - `POST /api/v1/liff/profile` - プロフィール作成/更新
  - **認証**: 既存の `verifyLineToken` ミドルウェア使用
  - **完了確認**: エンドポイント定義済み

- [ ] **`apps/workers/src/app.ts` にルート追加**
  ```typescript
  import profileRoutes from './features/liff/profile/routes'
  app.route('/api/v1', profileRoutes)
  ```
  - **完了確認**: ビルド成功

---

### Step 4: フロント連携

**参考**: 既存の `apps/web/src/app/test/_hooks/useUsersData.ts` のパターンを踏襲

#### 4-1. API通信フック作成

- [ ] **`apps/web/src/app/liff/profile/_hooks/useProfileData.ts`**
  ```typescript
  interface ProfileData {
    // TalentProfileRow と同じ構造
  }

  export function useProfileData(apiBase?: string) {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = async () => { /* fetch実装 */ }
    const saveProfile = async (data: ProfileFormData) => { /* save実装 */ }

    return { profile, loading, error, fetchProfile, saveProfile }
  }
  ```
  - **完了確認**: フック動作確認

#### 4-2. フォーム連携

- [ ] **`ProfileRegistrationForm.tsx` 修正**
  - `useProfileData` フックを使用
  - `handleSubmit` で `saveProfile` 呼び出し
  - 完成度表示をバックエンド値に変更
  - **完了確認**: 保存・取得が動作

#### 4-3. 入力フィールド改善

- [ ] **`DetailStep.tsx`, `SnsStep.tsx` 修正**
  - 数値入力に `type="number"`, `inputMode="numeric"`, `pattern="[0-9]*"` 追加
  - `min`, `max` 属性で範囲制限
  - **完了確認**: スマホで数字キーボード表示

---

### Step 5: 統合テスト

- [ ] **ローカル環境テスト**
  - [ ] プロフィール新規作成成功
  - [ ] DBにデータ保存確認
  - [ ] プロフィール編集成功
  - [ ] 完成度が正しく計算・表示
  - [ ] 必須項目バリデーション動作
  - [ ] 数値範囲バリデーション動作

- [ ] **開発環境デプロイ**
  - [ ] マイグレーション適用
  - [ ] Workers デプロイ成功
  - [ ] LIFF環境で動作確認

---

### 成功基準

- ✅ LIFFアプリからプロフィール作成・更新できる
- ✅ Supabase `talent_profiles` にデータが保存される
- ✅ 既存プロフィールを読み込み、フォームに反映できる
- ✅ 完成度が正しく計算・表示される
- ✅ スマホで数字キーボードが表示される
- ✅ バリデーションが動作する

---

### Phase 2の範囲外（後日実装）

- Cloudflare R2 を利用した画像アップロード
- 完成度履歴・バージョン管理
- オーディション応募時の完成度チェック
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
- **既存実装の参考**: `apps/web/src/app/test/`, `apps/workers/src/features/users/`
