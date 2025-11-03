-- エキストラ募集機能のサポート追加
-- [SF][CA][DRY] project_typeに'extra'を追加し、種別ごとの拡張データをJSONBで管理

-- ========================================
-- 1. auditionsテーブルの拡張
-- ========================================

-- project_typeの制約を更新（'extra'を追加）
DO $$ 
BEGIN
  -- 既存の制約を削除
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'auditions_project_type_check'
  ) THEN
    ALTER TABLE public.auditions DROP CONSTRAINT auditions_project_type_check;
  END IF;
  
  -- 新しい制約を追加（audition, job, extraの3種類）
  ALTER TABLE public.auditions 
    ADD CONSTRAINT auditions_project_type_check 
    CHECK (project_type IN ('audition', 'job', 'extra'));
END $$;

-- 種別ごとの拡張データを格納するJSONBカラムを追加
ALTER TABLE public.auditions 
  ADD COLUMN IF NOT EXISTS extra_details JSONB DEFAULT '{}'::jsonb;

-- extra_detailsカラムにコメント追加
COMMENT ON COLUMN public.auditions.extra_details IS '種別ごとの拡張データ（エキストラ: 集合場所・日程、求人: 勤務地・条件など）';

-- extra_detailsのインデックス追加（JSONB検索の高速化）
CREATE INDEX IF NOT EXISTS idx_auditions_extra_details 
  ON public.auditions USING gin (extra_details);

-- ========================================
-- 2. applicationsテーブルの拡張
-- ========================================

-- 応募時の種別固有データを格納するJSONBカラムを追加
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS extra_application_data JSONB DEFAULT '{}'::jsonb;

-- extra_application_dataカラムにコメント追加
COMMENT ON COLUMN public.applications.extra_application_data IS '応募時の種別固有データ（エキストラ: 出演可能日程など）';

-- extra_application_dataのインデックス追加
CREATE INDEX IF NOT EXISTS idx_applications_extra_data 
  ON public.applications USING gin (extra_application_data);

-- ========================================
-- 3. audition_typesテーブルの作成
-- ========================================

-- 種別ごとの設定を管理するテーブル
CREATE TABLE IF NOT EXISTS public.audition_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code TEXT NOT NULL UNIQUE CHECK (type_code IN ('audition', 'job', 'extra')),
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 50),
  description TEXT CHECK (char_length(description) <= 500),
  base_points INTEGER NOT NULL CHECK (base_points >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audition_types_code ON public.audition_types(type_code);
CREATE INDEX IF NOT EXISTS idx_audition_types_active ON public.audition_types(is_active);

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_audition_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_audition_types_updated_at ON public.audition_types;
CREATE TRIGGER trigger_audition_types_updated_at
  BEFORE UPDATE ON public.audition_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audition_types_updated_at();

-- RLS有効化
ALTER TABLE public.audition_types ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全員が閲覧可能
DROP POLICY IF EXISTS "Everyone can view audition types" ON public.audition_types;
CREATE POLICY "Everyone can view audition types"
  ON public.audition_types
  FOR SELECT
  USING (true);

-- ポリシー: 管理者のみが更新・削除可能
DROP POLICY IF EXISTS "Admins can manage audition types" ON public.audition_types;
CREATE POLICY "Admins can manage audition types"
  ON public.audition_types
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
COMMENT ON TABLE public.audition_types IS 'オーディション種別の設定（料金・表示名など）';
COMMENT ON COLUMN public.audition_types.type_code IS '種別コード（audition/job/extra）';
COMMENT ON COLUMN public.audition_types.base_points IS '基本料金（ポイント）';
COMMENT ON COLUMN public.audition_types.is_active IS '有効/無効フラグ';

-- ========================================
-- 4. 初期データの投入
-- ========================================

-- 種別マスタの初期データ（べき等性保証）
INSERT INTO public.audition_types (type_code, display_name, description, base_points, is_active)
VALUES 
  ('audition', 'オーディション', 'タレント・声優等の本選考', 3000, true),
  ('job', '求人', '長期雇用・スタッフ募集', 5000, true),
  ('extra', 'エキストラ募集', '短期・大量動員（撮影エキストラなど）', 10000, true)
ON CONFLICT (type_code) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  base_points = EXCLUDED.base_points,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
