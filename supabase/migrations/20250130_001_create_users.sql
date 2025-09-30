-- usersテーブル作成
-- 最小限の設計、プロフィール情報は別テーブルで管理

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 認証情報
  email TEXT UNIQUE,
  line_user_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'line', -- 'line' | 'email'
  
  -- 基本情報
  display_name TEXT,
  role TEXT DEFAULT 'applicant', -- 'applicant' | 'fan' | 'organizer' | 'manager' | 'admin'
  
  -- セキュリティ
  token_version INTEGER DEFAULT 0,
  
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_line_user_id ON users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- RLS (Row Level Security) 有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分の情報のみ閲覧・更新可能
CREATE POLICY users_select_own 
  ON users 
  FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY users_update_own 
  ON users 
  FOR UPDATE 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

-- コメント
COMMENT ON TABLE users IS 'ユーザー基本情報（最小限）';
COMMENT ON COLUMN users.auth_provider IS '認証プロバイダー: line | email';
COMMENT ON COLUMN users.role IS 'ロール: applicant | fan | organizer | manager | admin';
COMMENT ON COLUMN users.token_version IS 'JWTトークンバージョン（強制ログアウト用）';
