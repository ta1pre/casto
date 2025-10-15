-- application_reviews テーブル定義 (DDL)
-- [CA][SFT] 応募審査記録管理

CREATE TABLE IF NOT EXISTS public.application_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 応募・審査者への外部キー
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 審査結果
  decision TEXT NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'accept', 'reject')),
  comment TEXT,
  
  -- 最終決定フラグ
  is_final BOOLEAN NOT NULL DEFAULT false,
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_application_reviews_application_id ON public.application_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_application_reviews_reviewer_id ON public.application_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_application_reviews_is_final ON public.application_reviews(is_final);
CREATE INDEX IF NOT EXISTS idx_application_reviews_created_at ON public.application_reviews(created_at DESC);

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_application_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_application_reviews_updated_at ON public.application_reviews;
CREATE TRIGGER trigger_application_reviews_updated_at
  BEFORE UPDATE ON public.application_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_application_reviews_updated_at();

-- RLS（Row Level Security）を有効化
ALTER TABLE public.application_reviews ENABLE ROW LEVEL SECURITY;

-- ポリシー: 主催者は自身のオーディションへの応募に対する審査を閲覧可能
DROP POLICY IF EXISTS "Organizers can view reviews for own auditions" ON public.application_reviews;
CREATE POLICY "Organizers can view reviews for own auditions"
  ON public.application_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications app
      JOIN public.auditions a ON a.id = app.audition_id
      WHERE app.id = application_reviews.application_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 主催者は自身のオーディションへの応募に対する審査を作成可能
DROP POLICY IF EXISTS "Organizers can insert reviews for own auditions" ON public.application_reviews;
CREATE POLICY "Organizers can insert reviews for own auditions"
  ON public.application_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.applications app
      JOIN public.auditions a ON a.id = app.audition_id
      WHERE app.id = application_reviews.application_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 主催者は自身が作成した審査を更新可能
DROP POLICY IF EXISTS "Organizers can update own reviews" ON public.application_reviews;
CREATE POLICY "Organizers can update own reviews"
  ON public.application_reviews
  FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ポリシー: 管理者は全ての審査を閲覧可能
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.application_reviews;
CREATE POLICY "Admins can view all reviews"
  ON public.application_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全ての審査を作成可能
DROP POLICY IF EXISTS "Admins can insert all reviews" ON public.application_reviews;
CREATE POLICY "Admins can insert all reviews"
  ON public.application_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全ての審査を更新可能
DROP POLICY IF EXISTS "Admins can update all reviews" ON public.application_reviews;
CREATE POLICY "Admins can update all reviews"
  ON public.application_reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.application_reviews IS '応募審査記録テーブル';
COMMENT ON COLUMN public.application_reviews.decision IS '審査結果（pending/accept/reject）';
COMMENT ON COLUMN public.application_reviews.is_final IS '最終決定フラグ';
