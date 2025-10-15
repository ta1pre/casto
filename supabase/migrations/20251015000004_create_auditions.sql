-- auditions テーブル定義 (DDL)
-- [CA][SF] オーディション・求人の基本情報管理

CREATE TABLE IF NOT EXISTS public.auditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 主催者（organizer_profiles.user_idへの外部キー）
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 基本情報
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 5000),
  requirements TEXT,
  
  -- プロモーション向け短文・ビジュアル
  short_description TEXT CHECK (char_length(short_description) <= 100),
  cover_image_url TEXT CHECK (cover_image_url ~* '^https?://'),
  cover_image_alt TEXT CHECK (char_length(cover_image_alt) <= 120),
  
  -- 募集期間
  application_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  application_end_date TIMESTAMPTZ NOT NULL,
  
  -- 募集制限
  max_applicants INTEGER CHECK (max_applicants > 0), -- null = 無制限
  
  -- ステータス
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
  
  -- プロジェクトタイプ
  project_type TEXT NOT NULL DEFAULT 'audition' CHECK (project_type IN ('audition', 'job')),
  
  -- 審査方式（Phase 3A では manual のみ）
  evaluation_mode TEXT NOT NULL DEFAULT 'manual' CHECK (evaluation_mode IN ('manual', 'score_threshold', 'top_n', 'hybrid')),
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約: 終了日は開始日より後
  CONSTRAINT valid_date_range CHECK (application_end_date > application_start_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_auditions_organizer_id ON public.auditions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_auditions_status ON public.auditions(status);
CREATE INDEX IF NOT EXISTS idx_auditions_project_type ON public.auditions(project_type);
CREATE INDEX IF NOT EXISTS idx_auditions_application_end_date ON public.auditions(application_end_date);
CREATE INDEX IF NOT EXISTS idx_auditions_created_at ON public.auditions(created_at DESC);

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_auditions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_auditions_updated_at ON public.auditions;
CREATE TRIGGER trigger_auditions_updated_at
  BEFORE UPDATE ON public.auditions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_auditions_updated_at();

-- RLS（Row Level Security）を有効化
ALTER TABLE public.auditions ENABLE ROW LEVEL SECURITY;

-- ポリシー: 公開中のオーディションは誰でも閲覧可能
DROP POLICY IF EXISTS "Published auditions are viewable by everyone" ON public.auditions;
CREATE POLICY "Published auditions are viewable by everyone"
  ON public.auditions
  FOR SELECT
  USING (status = 'published');

-- ポリシー: 主催者は自身のオーディションを閲覧可能
DROP POLICY IF EXISTS "Organizers can view own auditions" ON public.auditions;
CREATE POLICY "Organizers can view own auditions"
  ON public.auditions
  FOR SELECT
  USING (auth.uid() = organizer_id);

-- ポリシー: 主催者は自身のオーディションを作成可能
DROP POLICY IF EXISTS "Organizers can insert own auditions" ON public.auditions;
CREATE POLICY "Organizers can insert own auditions"
  ON public.auditions
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

-- ポリシー: 主催者は自身のオーディションを更新可能
DROP POLICY IF EXISTS "Organizers can update own auditions" ON public.auditions;
CREATE POLICY "Organizers can update own auditions"
  ON public.auditions
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- ポリシー: 主催者は自身のオーディションを削除可能
DROP POLICY IF EXISTS "Organizers can delete own auditions" ON public.auditions;
CREATE POLICY "Organizers can delete own auditions"
  ON public.auditions
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- ポリシー: 管理者は全てのオーディションを閲覧可能
DROP POLICY IF EXISTS "Admins can view all auditions" ON public.auditions;
CREATE POLICY "Admins can view all auditions"
  ON public.auditions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全てのオーディションを更新可能
DROP POLICY IF EXISTS "Admins can update all auditions" ON public.auditions;
CREATE POLICY "Admins can update all auditions"
  ON public.auditions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全てのオーディションを削除可能
DROP POLICY IF EXISTS "Admins can delete all auditions" ON public.auditions;
CREATE POLICY "Admins can delete all auditions"
  ON public.auditions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.auditions IS 'オーディション・求人の基本情報';
COMMENT ON COLUMN public.auditions.organizer_id IS '主催者ID（usersテーブル外部キー）';
COMMENT ON COLUMN public.auditions.status IS 'ステータス（draft/published/closed/cancelled）';
COMMENT ON COLUMN public.auditions.project_type IS 'プロジェクトタイプ（audition/job）';
COMMENT ON COLUMN public.auditions.evaluation_mode IS '審査方式（manual/score_threshold/top_n/hybrid）';
