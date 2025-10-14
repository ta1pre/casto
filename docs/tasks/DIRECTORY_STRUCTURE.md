# ディレクトリ構成詳細

## 概要

Castoプロジェクトは以下の役割別に整理されたディレクトリ構成を採用します：

- **一般公開 (Public)**: 誰でもアクセス可能なページ（LP、クラファン閲覧等）
- **タレント・ファン (LIFF)**: LINEミニアプリ経由の認証済みユーザー
- **主催者 (Organizer)**: オーディション・クラファンを企画・管理する事業者
- **運営 (Admin)**: システム全体を管理する運営サイド

## ⚠️ 重要：既存機能への影響について

**Phase 1～5は既存機能に一切影響しません。**

- 既存の`apps/web/src/app/liff/`は**そのまま維持**
- 既存のLINE認証API（`/api/v1/auth/line/verify`）は**変更なし**
- 既存のWorkers APIエンドポイントは**すべて維持**
- Phase 6（ディレクトリリファクタリング）のみ慎重に実施

## フロントエンド構成 (`apps/web/src/app/`)

### 現状（変更なし）

```
apps/web/src/app/
├── liff/                        # 既存のLIFFページ（変更なし）
│   ├── layout.tsx
│   ├── page.tsx
│   ├── profile/
│   ├── auditions/
│   └── applications/
└── test/                        # テストページ
```

### 追加予定（新規ディレクトリのみ）

```
apps/web/src/app/
├── liff/                        # 【既存・変更なし】
│   └── ...
│
├── admin/                       # 【新規】運営サイド
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── users/
│       └── page.tsx
│
├── organizer/                   # 【新規】主催者サイド
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── auditions/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [auditionId]/
│   └── funding/
│       ├── page.tsx
│       └── new/
│
└── test/                        # 【既存・変更なし】
```

### Phase 6で実施（最後に慎重に）

```
apps/web/src/app/
├── (public)/                    # 【Phase 6】既存の公開ページを移行
│   ├── page.tsx
│   └── campaigns/
│
├── (liff)/                      # 【Phase 6】既存liff/を移行
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
│
├── admin/                       # 既に実装済み
├── organizer/                   # 既に実装済み
└── test/
```

## バックエンド構成 (`apps/workers/src/`)

### 現状（変更なし）

```
apps/workers/src/
├── app.ts                       # 【既存・変更なし】
├── features/
│   ├── health/                  # 【既存・変更なし】
│   ├── auth/                    # 【既存・変更なし】LINE認証
│   ├── liff/                    # 【既存・変更なし】
│   │   └── profile/
│   └── users/                   # 【既存・変更なし】
└── middleware/
    ├── authContext.ts           # 【既存・変更なし】
    └── verifyLineToken.ts       # 【既存・変更なし】
```

### 追加予定（新規ディレクトリのみ）

```
apps/workers/src/
├── app.ts                       # ルーティング追加のみ
├── features/
│   ├── health/                  # 【既存・変更なし】
│   ├── auth/                    # 【既存・変更なし】
│   ├── liff/                    # 【既存・変更なし】
│   ├── users/                   # 【既存・変更なし】
│   │
│   ├── admin/                   # 【新規】運営機能
│   │   ├── auth/
│   │   │   ├── routes.ts
│   │   │   └── service.ts
│   │   └── users/
│   │       ├── routes.ts
│   │       └── service.ts
│   │
│   ├── organizer/               # 【新規】主催者機能
│   │   ├── auth/
│   │   │   ├── routes.ts
│   │   │   └── service.ts
│   │   ├── auditions/
│   │   │   ├── routes.ts
│   │   │   └── service.ts
│   │   └── funding/
│   │       ├── routes.ts
│   │       └── service.ts
│   │
│   └── public/                  # 【新規】公開API
│       └── campaigns/
│           ├── routes.ts
│           └── service.ts
│
└── middleware/
    ├── authContext.ts           # 【既存・変更なし】
    ├── verifyLineToken.ts       # 【既存・変更なし】
    ├── verifyAdminAuth.ts       # 【新規】
    └── verifyOrganizerAuth.ts   # 【新規】
```

## API エンドポイント設計

### 既存エンドポイント（変更なし）

```
POST /api/v1/auth/line/verify    # LINE認証【既存・変更なし】
GET  /api/v1/auth/session        # セッション確認【既存・変更なし】
GET  /api/v1/liff/profile        # プロフィール取得【既存・変更なし】
POST /api/v1/liff/profile        # プロフィール更新【既存・変更なし】
POST /api/v1/liff/profile/photos # 写真アップロード【既存・変更なし】
```

### 新規エンドポイント

```
# 運営（新規）
POST /api/v1/admin/auth/signup
POST /api/v1/admin/auth/login
GET  /api/v1/admin/users
PUT  /api/v1/admin/users/:userId

# 主催者（新規）
POST /api/v1/organizer/auth/signup
POST /api/v1/organizer/auth/login
GET  /api/v1/organizer/auditions
POST /api/v1/organizer/auditions
GET  /api/v1/organizer/funding

# LIFF追加（既存プロフィールに追加）
GET  /api/v1/liff/auditions
POST /api/v1/liff/auditions/:id/apply
GET  /api/v1/liff/applications

# 公開API（新規）
GET  /api/v1/public/campaigns
GET  /api/v1/public/campaigns/:id
```

## データベース構成 (`supabase/schema/`)

### 既存テーブル（変更なし）

#### `users` テーブル

**変更なし。** 既存の構造をそのまま維持します。[PEC]

### 新規テーブル

#### `roles` テーブル（新規・マスタデータ）

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('admin', 'organizer', 'talent', 'fan')),
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ挿入
INSERT INTO roles (name, display_name, description) VALUES
  ('admin', '運営管理者', 'システム全体を管理する運営サイド'),
  ('organizer', '主催者', 'オーディション・クラファンを企画・管理する事業者'),
  ('talent', 'タレント', 'オーディションに応募するタレント・モデル'),
  ('fan', 'ファン', '一般ユーザー・支援者')
ON CONFLICT (name) DO NOTHING;
```

#### `user_roles` テーブル（新規・中間テーブル）

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

**設計意図**: 1ユーザーが複数のロールを持てるようにし、ロール切替でダッシュボードを変更可能にします。[MECE][CA]

#### `auditions` テーブル（新規）

```sql
CREATE TABLE auditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `applications` テーブル（新規）

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES auditions(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(audition_id, talent_id)
);
```

#### `campaigns` テーブル（新規）

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_amount INTEGER,
  current_amount INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'funded', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 共通パッケージ (`packages/shared/`)

### 既存（変更なし）

```
packages/shared/src/
├── types/
│   ├── user.ts                  # 【既存・変更なし】
│   └── profile.ts               # 【既存・変更なし】
└── utils/
    ├── user.ts                  # 【既存・変更なし】
    └── profileCompletion.ts     # 【既存・変更なし】
```

### 追加予定

```
packages/shared/src/
├── types/
│   ├── user.ts                  # 【既存・変更なし】
│   ├── profile.ts               # 【既存・変更なし】
│   ├── audition.ts              # 【新規】
│   ├── application.ts           # 【新規】
│   └── campaign.ts              # 【新規】
└── utils/
    ├── user.ts                  # 【既存・変更なし】
    ├── profileCompletion.ts     # 【既存・変更なし】
    ├── audition.ts              # 【新規】
    └── campaign.ts              # 【新規】
```

## 実装順序（既存機能への影響を最小化）

### Phase 1: データベース・認証基盤（影響：なし）

1. ✅ `supabase/schema/roles.sql`作成（新規ファイル）
2. ✅ `supabase/schema/user_roles.sql`作成（新規ファイル）
3. ✅ `./supabase/sync`でマイグレーション生成
4. ✅ Supabase Authのメール認証設定確認
5. ✅ `apps/workers/src/middleware/verifyAdminAuth.ts`作成（新規ファイル）
6. ✅ `apps/workers/src/middleware/verifyOrganizerAuth.ts`作成（新規ファイル）

### Phase 2: Workers API（影響：なし・新規エンドポイントのみ）

1. ✅ `apps/workers/src/features/admin/auth/`作成（新規ディレクトリ）
2. ✅ `apps/workers/src/features/organizer/auth/`作成（新規ディレクトリ）
3. ✅ `app.ts`にルーティング追加（既存ルート変更なし）
4. ✅ テストページで動作確認

### Phase 3: フロントエンド認証UI（影響：なし・新規ページのみ）

1. ✅ `apps/web/src/app/admin/`ディレクトリ作成
2. ✅ `apps/web/src/app/organizer/`ディレクトリ作成
3. ✅ 認証フック・コンポーネント実装
4. ✅ 動作確認

### Phase 4: オーディション機能（影響：なし・新規テーブル・API）

1. ✅ DBテーブル作成
2. ✅ Workers API実装
3. ✅ フロントエンドUI実装

### Phase 5: クラファン機能（影響：なし・新規機能）

1. ✅ DBテーブル作成
2. ✅ Workers API実装
3. ✅ フロントエンドUI実装

### Phase 6: ディレクトリリファクタリング（影響：あり・慎重に実施）

⚠️ **このフェーズのみ既存コードの移動が発生します。慎重に実施してください。**

1. ⚠️ `apps/web/src/app/(public)/`グループ作成
2. ⚠️ `apps/web/src/app/(liff)/`グループ作成（既存liff/から移行）
3. ⚠️ インポートパス修正
4. ⚠️ 動作確認

## 設計原則

- **[PEC] Preserve Existing Code**: 既存コードは最大限保持、新規機能は独立したディレクトリに配置
- **[SF] Simplicity First**: 必要最小限の機能から実装、段階的に拡張
- **[MECE] 分類の徹底**: 役割別（admin/organizer/liff/public）で漏れなく重複なく分離
- **[CA] Clean Architecture**: 機能ごとにroutes.ts + service.tsで構造化
- **[DRY] 重複排除**: 共通ロジックは`packages/shared`、認証は`middleware/`に集約
- **[SFT] Security First**: 認証ガード・RLS・権限チェックを徹底

---

**作成日**: 2025-10-14  
**関連**: [TODO.md](./TODO.md), [ARCHITECTURE.md](../ARCHITECTURE.md)
