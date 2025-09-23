# Supabase セットアップガイド

## 🗄️ プロジェクト作成後の設定

### 1. SQL Editorでスキーマ作成
1. Supabaseダッシュボード → **SQL Editor**
2. **schema.sql** の内容をコピー&ペースト
3. **Run** をクリックしてテーブル作成

### 2. 接続情報取得
Supabaseダッシュボード → **Settings** → **API** で以下を取得:

```
Project URL: https://your-project-id.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. GitHub Secretsに追加
以下のSecretsを追加:

```
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Vercel環境変数に追加
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

## 🧪 テスト用API エンドポイント

### GET /api/v1/users
全ユーザー取得（管理者のみ）

### POST /api/v1/users
新規ユーザー作成

### GET /api/v1/users/:id
特定ユーザー取得

### PUT /api/v1/users/:id
ユーザー情報更新

## 📋 最小限テーブル構造

### users テーブル
- `id`: UUID (Primary Key)
- `email`: VARCHAR(255) (Unique, Optional)
- `line_user_id`: VARCHAR(100) (Unique, Optional)
- `display_name`: VARCHAR(100) (Required)
- `avatar_url`: TEXT (Optional)
- `role`: ENUM ('applicant', 'fan', 'organizer', 'manager', 'admin')
- `auth_provider`: ENUM ('line', 'email')
- `is_active`: BOOLEAN (Default: true)
- `is_verified`: BOOLEAN (Default: false)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `last_login_at`: TIMESTAMP

### 制約・インデックス
- RLS (Row Level Security) 有効
- ユーザーは自分のデータのみアクセス
- 管理者は全データアクセス可能
- email OR line_user_id 必須制約
