-- casto最小限ユーザーテーブル設計
-- 5階層アカウント対応: applicant, fan, organizer, manager, admin

-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Users table (最小限)
CREATE TABLE IF NOT EXISTS users (
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

-- RLS (Row Level Security) 有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 管理者は全データアクセス可能
CREATE POLICY "Admins can view all data" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- テストデータ挿入
INSERT INTO users (email, display_name, role, auth_provider) VALUES
  ('admin@casto.app', 'システム管理者', 'admin', 'email'),
  ('organizer@example.com', 'テスト主催者', 'organizer', 'email')
ON CONFLICT (email) DO NOTHING;
