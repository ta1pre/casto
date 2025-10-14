-- 主催者プロフィールテーブル
-- [CA][SF] 主催者の公開プロフィール情報を管理

CREATE TABLE IF NOT EXISTS public.organizer_profiles (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 外部キー（usersテーブルと1:1）
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 🖼️ 画像
  logo_url TEXT,
  
  -- 🏢 基本情報
  name TEXT NOT NULL,
  contact_person TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  description TEXT NOT NULL,
  
  -- 📱 SNSリンク
  instagram_url TEXT,
  x_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  
  -- 🧩 公開フラグ
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- 🕓 監査情報
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ユニーク制約（1ユーザー1プロフィール）
  CONSTRAINT unique_organizer_id UNIQUE (organizer_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_organizer_id ON public.organizer_profiles(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_is_active ON public.organizer_profiles(is_active);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 主催者は自身のプロフィールを参照可能
DROP POLICY IF EXISTS "Organizers can view own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can view own profile"
  ON public.organizer_profiles
  FOR SELECT
  USING (auth.uid() = organizer_id);

-- ポリシー: 主催者は自身のプロフィールを更新可能
DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can update own profile"
  ON public.organizer_profiles
  FOR UPDATE
  USING (auth.uid() = organizer_id);

-- ポリシー: 主催者は自身のプロフィールを作成可能
DROP POLICY IF EXISTS "Organizers can insert own profile" ON public.organizer_profiles;
CREATE POLICY "Organizers can insert own profile"
  ON public.organizer_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

-- ポリシー: 管理者は全プロフィールを閲覧可能
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.organizer_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.organizer_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_organizer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_organizer_profiles_updated_at ON public.organizer_profiles;
CREATE TRIGGER trigger_organizer_profiles_updated_at
  BEFORE UPDATE ON public.organizer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organizer_profiles_updated_at();

-- コメント
COMMENT ON TABLE public.organizer_profiles IS '主催者プロフィールテーブル';
COMMENT ON COLUMN public.organizer_profiles.organizer_id IS 'ユーザーID（usersテーブル外部キー）';
COMMENT ON COLUMN public.organizer_profiles.logo_url IS 'ロゴ画像URL（正方形推奨）';
COMMENT ON COLUMN public.organizer_profiles.name IS '団体名・社名';
COMMENT ON COLUMN public.organizer_profiles.contact_person IS '担当者名（任意）';
COMMENT ON COLUMN public.organizer_profiles.address IS '住所';
COMMENT ON COLUMN public.organizer_profiles.phone IS '電話番号';
COMMENT ON COLUMN public.organizer_profiles.email IS 'メールアドレス（任意）';
COMMENT ON COLUMN public.organizer_profiles.website IS '公式サイトURL（任意）';
COMMENT ON COLUMN public.organizer_profiles.description IS '団体概要';
COMMENT ON COLUMN public.organizer_profiles.instagram_url IS 'Instagram URL（任意）';
COMMENT ON COLUMN public.organizer_profiles.x_url IS 'X (Twitter) URL（任意）';
COMMENT ON COLUMN public.organizer_profiles.tiktok_url IS 'TikTok URL（任意）';
COMMENT ON COLUMN public.organizer_profiles.youtube_url IS 'YouTube URL（任意）';
COMMENT ON COLUMN public.organizer_profiles.is_active IS '公開フラグ（true=公開、false=非公開）';
COMMENT ON COLUMN public.organizer_profiles.created_at IS '作成日時';
COMMENT ON COLUMN public.organizer_profiles.updated_at IS '更新日時';
