-- タレント・モデルプロフィールテーブル作成
-- [CA][SFT] 完成度・RLS設定込み

CREATE TABLE IF NOT EXISTS public.talent_profiles (
  -- プライマリキー（usersテーブルへの外部キー）
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

  -- 基本情報（必須）
  stage_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  birthdate DATE NOT NULL,
  prefecture TEXT NOT NULL,

  -- 基本情報（任意）
  occupation TEXT,

  -- 体型情報（数値型、任意）
  height NUMERIC(5, 2) CHECK (height >= 100 AND height <= 250),
  weight NUMERIC(5, 2) CHECK (weight >= 30 AND weight <= 200),
  bust NUMERIC(5, 2) CHECK (bust >= 50 AND bust <= 150),
  waist NUMERIC(5, 2) CHECK (waist >= 40 AND waist <= 120),
  hip NUMERIC(5, 2) CHECK (hip >= 50 AND hip <= 150),

  -- 自己PR
  achievements TEXT,

  -- 活動情報
  can_move BOOLEAN,
  can_stay BOOLEAN,
  passport_status TEXT,

  -- 所属・ステータス
  affiliation_type TEXT CHECK (affiliation_type IN ('freelance', 'business-partner', 'exclusive')),
  agency TEXT,

  -- SNS情報
  twitter TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  followers TEXT,

  -- 写真URL（将来実装）
  photo_face_url TEXT,
  photo_full_body_url TEXT,

  -- プロフィール完成度（0-100）
  completion_rate INTEGER NOT NULL DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),

  -- セクション別完成度（JSONB）
  completion_sections JSONB NOT NULL DEFAULT '{"basic":false,"photo":false,"detail":false,"affiliation":false,"sns":false}'::jsonb,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_talent_profiles_stage_name ON public.talent_profiles(stage_name);
CREATE INDEX idx_talent_profiles_completion_rate ON public.talent_profiles(completion_rate DESC);
CREATE INDEX idx_talent_profiles_created_at ON public.talent_profiles(created_at DESC);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_talent_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_talent_profiles_updated_at
  BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_profiles_updated_at();

-- RLS（Row Level Security）設定
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 認証済みユーザーは自身のプロフィールを参照可能
CREATE POLICY "Users can view their own profile"
  ON public.talent_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: 認証済みユーザーは自身のプロフィールを挿入可能
CREATE POLICY "Users can insert their own profile"
  ON public.talent_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: 認証済みユーザーは自身のプロフィールを更新可能
CREATE POLICY "Users can update their own profile"
  ON public.talent_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: 認証済みユーザーは自身のプロフィールを削除可能
CREATE POLICY "Users can delete their own profile"
  ON public.talent_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- コメント
COMMENT ON TABLE public.talent_profiles IS 'タレント・モデルのプロフィール情報';
COMMENT ON COLUMN public.talent_profiles.user_id IS 'ユーザーID（usersテーブル外部キー）';
COMMENT ON COLUMN public.talent_profiles.completion_rate IS 'プロフィール完成度（0-100）';
COMMENT ON COLUMN public.talent_profiles.completion_sections IS 'セクション別完成度（JSON）';
