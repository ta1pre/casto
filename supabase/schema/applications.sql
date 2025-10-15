-- applications テーブル定義 (DDL)
-- [CA][SFT] オーディション応募情報管理（talent_profilesのスナップショット保存）

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- オーディション・応募者への外部キー
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- talent_profiles のスナップショット（応募時点の情報を保持）
  applicant_profile JSONB NOT NULL,
  
  -- オーディション固有の追加情報
  additional_message TEXT CHECK (char_length(additional_message) <= 2000),
  additional_urls TEXT[] DEFAULT '{}',
  
  -- ステータス
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected', 'withdrawn')),
  
  -- タイムスタンプ
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約: 同一ユーザーは同一オーディションに1回のみ応募可
  UNIQUE(audition_id, applicant_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_applications_audition_id ON public.applications(audition_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON public.applications(submitted_at DESC);

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_applications_updated_at ON public.applications;
CREATE TRIGGER trigger_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_applications_updated_at();

-- RLS（Row Level Security）を有効化
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ポリシー: 応募者は自身の応募を閲覧可能
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
CREATE POLICY "Applicants can view own applications"
  ON public.applications
  FOR SELECT
  USING (auth.uid() = applicant_id);

-- ポリシー: 主催者は自身のオーディションへの応募を閲覧可能
DROP POLICY IF EXISTS "Organizers can view applications to own auditions" ON public.applications;
CREATE POLICY "Organizers can view applications to own auditions"
  ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions a
      WHERE a.id = applications.audition_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 認証済みユーザーは応募を作成可能
DROP POLICY IF EXISTS "Authenticated users can insert applications" ON public.applications;
CREATE POLICY "Authenticated users can insert applications"
  ON public.applications
  FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- ポリシー: 応募者は自身の応募を更新可能（辞退のみ）
DROP POLICY IF EXISTS "Applicants can update own applications" ON public.applications;
CREATE POLICY "Applicants can update own applications"
  ON public.applications
  FOR UPDATE
  USING (auth.uid() = applicant_id AND status = 'submitted')
  WITH CHECK (auth.uid() = applicant_id);

-- ポリシー: 主催者は自身のオーディションへの応募を更新可能（審査結果の更新）
DROP POLICY IF EXISTS "Organizers can update applications to own auditions" ON public.applications;
CREATE POLICY "Organizers can update applications to own auditions"
  ON public.applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions a
      WHERE a.id = applications.audition_id
      AND a.organizer_id = auth.uid()
    )
  );

-- ポリシー: 管理者は全ての応募を閲覧可能
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
CREATE POLICY "Admins can view all applications"
  ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- ポリシー: 管理者は全ての応募を更新可能
DROP POLICY IF EXISTS "Admins can update all applications" ON public.applications;
CREATE POLICY "Admins can update all applications"
  ON public.applications
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
COMMENT ON TABLE public.applications IS 'オーディション応募情報';
COMMENT ON COLUMN public.applications.applicant_profile IS 'talent_profilesのスナップショット（応募時点のプロフィール情報）';
COMMENT ON COLUMN public.applications.additional_message IS '志望動機などオーディション固有のメッセージ';
COMMENT ON COLUMN public.applications.additional_urls IS '外部URL（最大5件）';
COMMENT ON COLUMN public.applications.status IS 'ステータス（submitted/under_review/accepted/rejected/withdrawn）';
