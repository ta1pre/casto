-- applicant_profiles テーブル作成
-- 応募者（ファン・キャスト）のプロフィール情報を管理

CREATE TABLE IF NOT EXISTS applicant_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- 基本情報（必須）
  nickname VARCHAR(100),
  birthdate DATE,
  
  -- 詳細情報（任意）
  gender VARCHAR(20),
  prefecture VARCHAR(50),
  bio TEXT,
  avatar_url TEXT,
  
  -- メタデータ
  profile_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_applicant_profiles_user_id ON applicant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_applicant_profiles_completed ON applicant_profiles(profile_completed_at) WHERE profile_completed_at IS NOT NULL;

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_applicant_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_applicant_profiles_updated_at
  BEFORE UPDATE ON applicant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_applicant_profiles_updated_at();

-- RLS (Row Level Security) 有効化
ALTER TABLE applicant_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分のプロフィールのみ閲覧・編集可能
CREATE POLICY applicant_profiles_select_own
  ON applicant_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY applicant_profiles_insert_own
  ON applicant_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY applicant_profiles_update_own
  ON applicant_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- コメント
COMMENT ON TABLE applicant_profiles IS '応募者（ファン・キャスト）のプロフィール情報';
COMMENT ON COLUMN applicant_profiles.nickname IS 'ニックネーム（必須）';
COMMENT ON COLUMN applicant_profiles.birthdate IS '生年月日（必須）';
COMMENT ON COLUMN applicant_profiles.profile_completed_at IS 'プロフィール完成日時（nickname + birthdateが入力された時点で設定）';
