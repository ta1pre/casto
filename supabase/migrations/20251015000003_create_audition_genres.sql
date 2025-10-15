-- audition_genres テーブル定義 (DDL)
-- [CA][SF] ジャンルマスタ - オーディション/求人のカテゴリ管理

CREATE TABLE IF NOT EXISTS public.audition_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ジャンル識別子
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  
  -- 分類情報
  category TEXT,
  description TEXT,
  
  -- 表示順序
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- アクティブフラグ
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audition_genres_slug ON public.audition_genres(slug);
CREATE INDEX IF NOT EXISTS idx_audition_genres_is_active ON public.audition_genres(is_active);
CREATE INDEX IF NOT EXISTS idx_audition_genres_sort_order ON public.audition_genres(sort_order);

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_audition_genres_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_audition_genres_updated_at ON public.audition_genres;
CREATE TRIGGER trigger_audition_genres_updated_at
  BEFORE UPDATE ON public.audition_genres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audition_genres_updated_at();

-- RLS（Row Level Security）を有効化
ALTER TABLE public.audition_genres ENABLE ROW LEVEL SECURITY;

-- ポリシー: 誰でもジャンルを閲覧可能
DROP POLICY IF EXISTS "Anyone can view genres" ON public.audition_genres;
CREATE POLICY "Anyone can view genres"
  ON public.audition_genres
  FOR SELECT
  USING (is_active = true);

-- ポリシー: 管理者のみジャンルを作成可能
DROP POLICY IF EXISTS "Admins can insert genres" ON public.audition_genres;
CREATE POLICY "Admins can insert genres"
  ON public.audition_genres
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者のみジャンルを更新可能
DROP POLICY IF EXISTS "Admins can update genres" ON public.audition_genres;
CREATE POLICY "Admins can update genres"
  ON public.audition_genres
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者のみジャンルを削除可能
DROP POLICY IF EXISTS "Admins can delete genres" ON public.audition_genres;
CREATE POLICY "Admins can delete genres"
  ON public.audition_genres
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
COMMENT ON TABLE public.audition_genres IS 'オーディション・求人のジャンルマスタ';
COMMENT ON COLUMN public.audition_genres.slug IS 'ジャンル識別子（URL用）';
COMMENT ON COLUMN public.audition_genres.display_name IS '表示名';
COMMENT ON COLUMN public.audition_genres.sort_order IS '表示順序（昇順）';
