-- オーディションステップ機能 (DDL)
-- [CA][SF] 選考ステップ、応募、評価の管理

-- ========================================
-- 1. audition_steps テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS public.audition_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order > 0),
  step_type TEXT NOT NULL CHECK (step_type IN ('document_screening', 'custom', 'voting')),
  title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_audition_step_order UNIQUE(audition_id, step_order)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audition_steps_audition_id ON public.audition_steps(audition_id);
CREATE INDEX IF NOT EXISTS idx_audition_steps_step_order ON public.audition_steps(audition_id, step_order);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION public.update_audition_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audition_steps_updated_at ON public.audition_steps;
CREATE TRIGGER trigger_audition_steps_updated_at
  BEFORE UPDATE ON public.audition_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audition_steps_updated_at();

-- RLS有効化
ALTER TABLE public.audition_steps ENABLE ROW LEVEL SECURITY;

-- ポリシー: 主催者は自身のオーディションのステップを管理可能
DROP POLICY IF EXISTS "Organizers can manage their audition steps" ON public.audition_steps;
CREATE POLICY "Organizers can manage their audition steps"
  ON public.audition_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_steps.audition_id
        AND auditions.organizer_id = auth.uid()
    )
  );

-- ポリシー: 公開中のオーディションのステップは誰でも閲覧可能
DROP POLICY IF EXISTS "Public can view published audition steps" ON public.audition_steps;
CREATE POLICY "Public can view published audition steps"
  ON public.audition_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_steps.audition_id
        AND auditions.status = 'published'
    )
  );

-- ポリシー: 管理者は全てのステップを管理可能
DROP POLICY IF EXISTS "Admins can manage all audition steps" ON public.audition_steps;
CREATE POLICY "Admins can manage all audition steps"
  ON public.audition_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.audition_steps IS 'オーディションの選考ステップ定義';
COMMENT ON COLUMN public.audition_steps.step_order IS 'ステップの順序（1=書類選考は必須）';
COMMENT ON COLUMN public.audition_steps.step_type IS 'ステップ種別（document_screening/custom/voting）';

-- ========================================
-- 2. audition_applications テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS public.audition_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES public.audition_steps(id) ON DELETE SET NULL,
  overall_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (overall_status IN ('pending', 'in_progress', 'passed', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_audition_talent UNIQUE(audition_id, talent_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audition_applications_audition_id ON public.audition_applications(audition_id);
CREATE INDEX IF NOT EXISTS idx_audition_applications_talent_id ON public.audition_applications(talent_id);
CREATE INDEX IF NOT EXISTS idx_audition_applications_current_step ON public.audition_applications(current_step_id);
CREATE INDEX IF NOT EXISTS idx_audition_applications_status ON public.audition_applications(overall_status);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION public.update_audition_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audition_applications_updated_at ON public.audition_applications;
CREATE TRIGGER trigger_audition_applications_updated_at
  BEFORE UPDATE ON public.audition_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audition_applications_updated_at();

-- RLS有効化
ALTER TABLE public.audition_applications ENABLE ROW LEVEL SECURITY;

-- ポリシー: 主催者は自身のオーディションの応募を閲覧可能
DROP POLICY IF EXISTS "Organizers can view applications for their auditions" ON public.audition_applications;
CREATE POLICY "Organizers can view applications for their auditions"
  ON public.audition_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_applications.audition_id
        AND auditions.organizer_id = auth.uid()
    )
  );

-- ポリシー: 主催者は応募ステータスを更新可能
DROP POLICY IF EXISTS "Organizers can update applications for their auditions" ON public.audition_applications;
CREATE POLICY "Organizers can update applications for their auditions"
  ON public.audition_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditions
      WHERE auditions.id = audition_applications.audition_id
        AND auditions.organizer_id = auth.uid()
    )
  );

-- ポリシー: タレントは自身の応募を閲覧可能
DROP POLICY IF EXISTS "Talents can view their own applications" ON public.audition_applications;
CREATE POLICY "Talents can view their own applications"
  ON public.audition_applications
  FOR SELECT
  USING (talent_id = auth.uid());

-- ポリシー: タレントは応募を作成可能
DROP POLICY IF EXISTS "Talents can create applications" ON public.audition_applications;
CREATE POLICY "Talents can create applications"
  ON public.audition_applications
  FOR INSERT
  WITH CHECK (talent_id = auth.uid());

-- ポリシー: タレントは自身の応募を取り下げ可能（withdrawnに変更）
DROP POLICY IF EXISTS "Talents can withdraw their own applications" ON public.audition_applications;
CREATE POLICY "Talents can withdraw their own applications"
  ON public.audition_applications
  FOR UPDATE
  USING (talent_id = auth.uid())
  WITH CHECK (talent_id = auth.uid() AND overall_status = 'withdrawn');

-- ポリシー: 管理者は全ての応募を管理可能
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.audition_applications;
CREATE POLICY "Admins can manage all applications"
  ON public.audition_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.audition_applications IS 'オーディション応募エントリー';
COMMENT ON COLUMN public.audition_applications.current_step_id IS '現在の選考ステップ';
COMMENT ON COLUMN public.audition_applications.overall_status IS '全体ステータス（pending/in_progress/passed/rejected/withdrawn）';

-- ========================================
-- 3. audition_step_evaluations テーブル
-- ========================================
CREATE TABLE IF NOT EXISTS public.audition_step_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.audition_applications(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.audition_steps(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  score NUMERIC(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  comments TEXT CHECK (char_length(comments) <= 2000),
  result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'passed', 'rejected')),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_application_step UNIQUE(application_id, step_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_evaluations_application_id ON public.audition_step_evaluations(application_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_step_id ON public.audition_step_evaluations(step_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator_id ON public.audition_step_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_result ON public.audition_step_evaluations(result);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION public.update_audition_step_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audition_step_evaluations_updated_at ON public.audition_step_evaluations;
CREATE TRIGGER trigger_audition_step_evaluations_updated_at
  BEFORE UPDATE ON public.audition_step_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audition_step_evaluations_updated_at();

-- RLS有効化
ALTER TABLE public.audition_step_evaluations ENABLE ROW LEVEL SECURITY;

-- ポリシー: 主催者は自身のオーディションの評価を管理可能
DROP POLICY IF EXISTS "Organizers can manage evaluations" ON public.audition_step_evaluations;
CREATE POLICY "Organizers can manage evaluations"
  ON public.audition_step_evaluations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.audition_applications
      JOIN public.auditions ON auditions.id = audition_applications.audition_id
      WHERE audition_applications.id = audition_step_evaluations.application_id
        AND auditions.organizer_id = auth.uid()
    )
  );

-- ポリシー: タレントは自身の評価を閲覧可能
DROP POLICY IF EXISTS "Talents can view their own evaluations" ON public.audition_step_evaluations;
CREATE POLICY "Talents can view their own evaluations"
  ON public.audition_step_evaluations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audition_applications
      WHERE audition_applications.id = audition_step_evaluations.application_id
        AND audition_applications.talent_id = auth.uid()
    )
  );

-- ポリシー: 管理者は全ての評価を管理可能
DROP POLICY IF EXISTS "Admins can manage all evaluations" ON public.audition_step_evaluations;
CREATE POLICY "Admins can manage all evaluations"
  ON public.audition_step_evaluations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.audition_step_evaluations IS 'ステップごとの評価データ';
COMMENT ON COLUMN public.audition_step_evaluations.score IS '0～100点の採点（任意）';
COMMENT ON COLUMN public.audition_step_evaluations.result IS '合否判定（主催者が手動設定: pending/passed/rejected）';
COMMENT ON COLUMN public.audition_step_evaluations.evaluator_id IS '評価者ID（主催者または審査員）';
