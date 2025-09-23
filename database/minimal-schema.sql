-- 最小限のユーザーテーブル（テスト用）
-- 既存テーブルを削除して再作成

DROP TABLE IF EXISTS users CASCADE;

-- 最小限のユーザーテーブル
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  line_user_id VARCHAR(100) UNIQUE,
  
  -- 基本情報
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  
  -- アカウント種別
  role VARCHAR(20) NOT NULL DEFAULT 'applicant' 
    CHECK (role IN ('applicant', 'fan', 'organizer', 'manager', 'admin')),
  
  -- 認証方法
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'line'
    CHECK (auth_provider IN ('line', 'email')),
  
  -- ステータス
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- 制約: emailまたはline_user_idのどちらかは必須
  CONSTRAINT users_auth_check CHECK (
    (email IS NOT NULL) OR (line_user_id IS NOT NULL)
  )
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- テストデータ挿入
INSERT INTO users (email, display_name, role, auth_provider) VALUES
  ('admin@casto.app', 'システム管理者', 'admin', 'email'),
  ('test@example.com', 'テストユーザー', 'applicant', 'email'),
  ('organizer@example.com', 'テスト主催者', 'organizer', 'email')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (line_user_id, display_name, role, auth_provider) VALUES
  ('line_test_user_001', 'LINE テストユーザー', 'fan', 'line')
ON CONFLICT (line_user_id) DO NOTHING;
