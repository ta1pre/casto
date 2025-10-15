-- audition_genre_map テーブル定義 (DDL)
-- [CA][DRY] オーディション×ジャンルの中間テーブル

CREATE TABLE IF NOT EXISTS public.audition_genre_map (
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.audition_genres(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (audition_id, genre_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audition_genre_map_audition_id ON public.audition_genre_map(audition_id);
CREATE INDEX IF NOT EXISTS idx_audition_genre_map_genre_id ON public.audition_genre_map(genre_id);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.audition_genre_map ENABLE ROW LEVEL SECURITY;

-- ポリシー: 公開中のオーディションのジャンル紐付けは誰でも閲覧可能
DROP POLICY IF EXISTS "Published audition genres are viewable by everyone" ON public.audition_genre_map;
CREATE POLICY "Published audition genres are viewable by everyone"
  ON public.audition_genre_map
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions a
      WHERE a.id = audition_genre_map.audition_id
      AND a.status = 'published'
    )
  );

-- ポリシー: 主催者は自身のオーディションのジャンル紐付けを閲覧可能
DROP POLICY IF EXISTS "Organizers can view own audition genres" ON public.audition_genre_map;
CREATE POLICY "Organizers can view own audition genres"
  ON public.audition_genre_map
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions a
      WHERE a.id = audition_genre_map.audition_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 主催者は自身のオーディションのジャンル紐付けを作成可能
DROP POLICY IF EXISTS "Organizers can insert own audition genres" ON public.audition_genre_map;
CREATE POLICY "Organizers can insert own audition genres"
  ON public.audition_genre_map
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditions a
      WHERE a.id = audition_genre_map.audition_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 主催者は自身のオーディションのジャンル紐付けを削除可能
DROP POLICY IF EXISTS "Organizers can delete own audition genres" ON public.audition_genre_map;
CREATE POLICY "Organizers can delete own audition genres"
  ON public.audition_genre_map
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions a
      WHERE a.id = audition_genre_map.audition_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 管理者は全てのジャンル紐付けを閲覧可能
DROP POLICY IF EXISTS "Admins can view all audition genres" ON public.audition_genre_map;
CREATE POLICY "Admins can view all audition genres"
  ON public.audition_genre_map
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全てのジャンル紐付けを作成可能
DROP POLICY IF EXISTS "Admins can insert all audition genres" ON public.audition_genre_map;
CREATE POLICY "Admins can insert all audition genres"
  ON public.audition_genre_map
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全てのジャンル紐付けを削除可能
DROP POLICY IF EXISTS "Admins can delete all audition genres" ON public.audition_genre_map;
CREATE POLICY "Admins can delete all audition genres"
  ON public.audition_genre_map
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
COMMENT ON TABLE public.audition_genre_map IS 'オーディション×ジャンルの中間テーブル';
