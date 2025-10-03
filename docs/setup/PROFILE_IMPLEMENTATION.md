# プロフィール登録機能 実装ガイド

## 概要

タレント・モデルがプロフィール情報を登録し、審査に必要な完成度を可視化する機能の実装ドキュメント。

## アーキテクチャ

### データフロー

```
Web (React) → Workers (Hono) → Supabase (PostgreSQL)
     ↓              ↓                    ↓
 useProfileData  service.ts      talent_profiles
 ProfileForm     routes.ts           (RLS)
```

### 共通型管理

`packages/shared` で型・ユーティリティを一元管理し、Workers/Web両方から参照。

```
packages/shared/
├── src/
│   ├── types/
│   │   └── profile.ts          # 共通型定義
│   ├── utils/
│   │   ├── profileCompletion.ts   # 完成度計算
│   │   └── profileValidation.ts   # バリデーション
```

## データベース設計

### `talent_profiles` テーブル

```sql
CREATE TABLE public.talent_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 基本情報（必須）
  stage_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  birthdate DATE NOT NULL,
  prefecture TEXT NOT NULL,
  
  -- 体型情報（数値型、範囲チェック付き）
  height NUMERIC(5, 2) CHECK (height >= 100 AND height <= 250),
  weight NUMERIC(5, 2) CHECK (weight >= 30 AND weight <= 200),
  ...
  
  -- プロフィール完成度
  completion_rate INTEGER NOT NULL DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  completion_sections JSONB NOT NULL DEFAULT '{"basic":false,"photo":false,...}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLSポリシー**: 認証済みユーザーが自身のレコードのみCRUD可能。

**マイグレーション**: `supabase/migrations/20251004000000_create_talent_profiles.sql`

## API仕様

### エンドポイント

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/v1/liff/profile` | プロフィール取得 | LINE必須 |
| POST | `/api/v1/liff/profile` | プロフィール作成・更新 | LINE必須 |
| PUT | `/api/v1/liff/profile` | プロフィール完全更新 | LINE必須 |
| PATCH | `/api/v1/liff/profile` | プロフィール部分更新 | LINE必須 |

### リクエスト例 (POST)

```json
{
  "stage_name": "山田花子",
  "gender": "female",
  "birthdate": "1998-03-15",
  "prefecture": "東京都",
  "height": 165,
  "weight": 50,
  "bust": 83,
  "waist": 60,
  "hip": 88,
  "achievements": "モデル歴5年...",
  "affiliation_type": "freelance",
  "twitter": "@yamada_hanako",
  "instagram": "yamada_hanako"
}
```

### レスポンス例

```json
{
  "profile": {
    "user_id": "uuid...",
    "stage_name": "山田花子",
    "gender": "female",
    ...
    "completion_rate": 80,
    "completion_sections": {
      "basic": true,
      "photo": false,
      "detail": true,
      "affiliation": true,
      "sns": true
    },
    "created_at": "2025-10-04T...",
    "updated_at": "2025-10-04T..."
  }
}
```

## バリデーション

### 必須項目

- `stage_name`: 芸名
- `gender`: 性別 (`male`, `female`, `other`)
- `birthdate`: 生年月日 (YYYY-MM-DD形式)
- `prefecture`: 都道府県

### 数値範囲

- `height`: 100〜250 cm
- `weight`: 30〜200 kg
- `bust`: 50〜150 cm
- `waist`: 40〜120 cm
- `hip`: 50〜150 cm

バリデーションは`packages/shared/src/utils/profileValidation.ts`で共通実装。

## 完成度計算

プロフィールは5つのセクションで構成され、各セクション20%で合計100%。

| セクション | 条件 |
|-----------|------|
| basic | 必須4項目すべて入力 |
| photo | 顔写真or全身写真が登録済み |
| detail | 体型・自己PR等、いずれか1つ以上入力 |
| affiliation | 所属タイプor事務所名、いずれか1つ以上入力 |
| sns | SNSアカウント、いずれか1つ以上入力 |

完成度計算は`packages/shared/src/utils/profileCompletion.ts`で共通実装。

## Web側実装

### ディレクトリ構造

```
apps/web/src/app/liff/profile/
├── _components/
│   ├── ProfileRegistrationForm.tsx  # メインフォーム
│   ├── steps/                       # ステップ別コンポーネント
│   └── ui/                          # UI部品
├── _hooks/
│   └── useProfileData.ts            # データ取得・保存フック
└── _utils/
    └── profileConverter.ts          # 型変換ユーティリティ
```

### 使用方法

```tsx
import { useProfileData } from './_hooks/useProfileData'
import { formDataToApiInput } from './_utils/profileConverter'

function MyComponent() {
  const { profile, loading, error, save } = useProfileData()
  
  const handleSave = async (formData: ProfileFormData) => {
    const apiInput = formDataToApiInput(formData)
    await save(apiInput)
  }
}
```

## Workers側実装

### ディレクトリ構造

```
apps/workers/src/features/liff/profile/
├── service.ts   # ビジネスロジック
└── routes.ts    # ルート定義
```

### 認証

`verifyLineToken` ミドルウェアでLINE認証をチェック。

```typescript
profileRoutes.use('/*', verifyLineToken)
```

## テスト

### 統合テストページ

`/test/profile` で動作確認可能。

- GET: プロフィール取得
- POST: プロフィール作成
- PUT: プロフィール更新
- PATCH: 部分更新

### ローカル開発

```bash
# Supabaseローカル環境起動
cd supabase && supabase start

# マイグレーション適用
supabase db reset

# Workers起動
cd apps/workers && npm run dev

# Web起動
cd apps/web && npm run dev
```

### テストフロー

1. `/test/auth/line` でLINE認証を実施
2. `/test/profile` でプロフィールAPIをテスト
3. `/liff/profile` で実際のフォームをテスト

## トラブルシューティング

### 404エラー

- 初回プロフィール作成前は404が正常（POSTで作成）
- RLSポリシーで自身のレコードのみアクセス可能

### バリデーションエラー

- 必須項目（stage_name, gender, birthdate, prefecture）が入力されているか確認
- 数値項目が範囲内か確認

### 完成度が更新されない

- Workers側で`calculateTalentProfileCompletion()`を呼び出し、DB保存時に自動計算
- フロント側は`profile.completion_rate`を表示

## 今後の拡張

### 写真アップロード

現在`photo_face_url`, `photo_full_body_url`はnull。Supabase Storageとの連携が必要。

### セクション別保存

現在は全体を一括保存。将来的にセクション単位での部分保存も検討。

### バリデーションメッセージのUI表示

現在はエラーメッセージをalertで表示。各フィールド下に表示する仕組みを追加予定。

## 参考

- [アーキテクチャ概要](../ARCHITECTURE.md)
- [Supabaseスキーマ管理](./SUPABASE_SCHEMA_MANAGEMENT.md)
- [ローカル開発環境](./LOCAL_DEVELOPMENT.md)
