# Supabase セットアップガイド

## 1. Supabaseプロジェクト作成

### 1-1. アカウント作成・ログイン
1. https://supabase.com/ にアクセス
2. "Start your project" をクリック
3. GitHubアカウントでログイン

### 1-2. 新プロジェクト作成
```
Project name: casto-dev
Database password: 強力なパスワードを生成
Region: Northeast Asia (Tokyo) - ap-northeast-1
Pricing plan: Free tier
```

### 1-3. 接続情報取得
プロジェクト作成後、以下の情報をメモ：
```
Project URL: https://your-project-id.supabase.co
API Key (anon): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API Key (service_role): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Database URL: postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
```

## 2. データベーススキーマ作成

### 2-1. SQL Editorでスキーマ実行
Supabase Dashboard → SQL Editor → New query

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  token_version INTEGER DEFAULT 0,
  flags JSONB DEFAULT '{}'::jsonb
);

-- ユーザー認証情報テーブル
CREATE TABLE user_handles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('line', 'email')),
  handle TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, handle)
);

-- ユーザーロールテーブル
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('applicant', 'fan', 'organizer', 'manager')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- オーディションテーブル
CREATE TABLE auditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
  application_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 応募エントリーテーブル
CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audition_id UUID REFERENCES auditions(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_snapshot JSONB NOT NULL,
  assets JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(audition_id, applicant_id)
);

-- 課金・決済テーブル
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('profile_view', 'premium_feature')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'JPY',
  external_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 通知テーブル
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('line', 'email')),
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 監査ログテーブル
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2-2. RLS (Row Level Security) 設定
```sql
-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー（後で詳細化）
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
```

## 3. 実際の設定情報（2025-09-22完了）

### 3-1. プロジェクト情報
```
Project ID: sfscmpjplvxtikmifqhe
Project URL: https://sfscmpjplvxtikmifqhe.supabase.co
Publishable key: sb_publishable_lUKB-yKUWzktgl6kVqI2vg_a7EDeLWs
Secret key: sb_secret__Lv-HqBCTZt3F7vFBbQsZA_SpUmgdGK
```

### 3-2. 環境変数設定（完了済み）
```bash
# .env.local に設定済み
SUPABASE_URL="https://sfscmpjplvxtikmifqhe.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_lUKB-yKUWzktgl6kVqI2vg_a7EDeLWs"
SUPABASE_SERVICE_ROLE_KEY="sb_secret__Lv-HqBCTZt3F7vFBbQsZA_SpUmgdGK"
DATABASE_URL="postgresql://postgres.sfscmpjplvxtikmifqhe:8even8tar8@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

### 3-2. Cloudflare Workers シークレット設定
```bash
cd /Users/taichiumeki/dev/services/casto/apps/workers
wrangler secret put DATABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

## 4. データベーススキーマ作成（完了済み）

### 4-1. マイグレーションファイル作成
```bash
# ファイル作成済み: supabase/migrations/001_initial_schema.sql
# 8テーブル + RLS + インデックス + トリガー
```

### 4-2. スキーマ適用
```bash
# 実行済み
supabase db reset --linked  # データベースリセット
supabase db push --linked   # マイグレーション適用
```

### 4-3. 作成されたテーブル
- `users` - ユーザー基本情報
- `user_handles` - 認証情報（LINE/Email）
- `user_roles` - ロール管理（applicant/fan/organizer/manager）
- `auditions` - オーディション情報
- `entries` - 応募エントリー
- `payments` - 課金・決済
- `notifications` - 通知管理
- `audit_logs` - 監査ログ

## 5. 接続テスト（完了済み）

### 5-1. Supabase CLI接続テスト
```bash
# 実行済み - 成功
supabase login
supabase link --project-ref sfscmpjplvxtikmifqhe
```

### 5-2. PostgreSQL直接接続
```bash
# PostgreSQL クライアントインストール済み
brew install postgresql
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
```

## 6. 完了状況

### ✅ 完了済み
- Supabaseプロジェクト作成
- データベーススキーマ作成（8テーブル）
- RLS（Row Level Security）設定
- 環境変数設定
- Supabase CLI接続確認
- マイグレーション適用

### 🚀 次のステップ
→ **Cloudflare Workers環境設定**
