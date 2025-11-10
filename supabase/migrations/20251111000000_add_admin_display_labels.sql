-- Admin表示ラベル機能
-- [SF][CA] Admin代理公開時の主催者情報表示制御を実現
-- [REH] Adminのみ操作可能なRLSポリシーを設定

-- 1. admin_display_labels テーブルの作成
CREATE TABLE IF NOT EXISTS public.admin_display_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 表示ラベル（例: castoオリジナル案件, Aプロダクション, B芸能）
  label TEXT NOT NULL CHECK (char_length(label) >= 1 AND char_length(label) <= 100),
  
  -- 説明文（管理画面での補足）
  description TEXT CHECK (char_length(description) <= 500),
  
  -- 有効/無効フラグ
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 制約: 同じラベル名は重複不可
  CONSTRAINT unique_label UNIQUE (label)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_admin_display_labels_is_active 
  ON public.admin_display_labels(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_display_labels_label 
  ON public.admin_display_labels(label);

-- 更新日時の自動更新トリガー関数（既存のものを再利用）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_admin_display_labels_updated_at 
  ON public.admin_display_labels;
CREATE TRIGGER trigger_admin_display_labels_updated_at
  BEFORE UPDATE ON public.admin_display_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS（Row Level Security）を有効化
ALTER TABLE public.admin_display_labels ENABLE ROW LEVEL SECURITY;

-- ポリシー: 管理者のみ全操作可能
DROP POLICY IF EXISTS "Admins can manage admin display labels" 
  ON public.admin_display_labels;
CREATE POLICY "Admins can manage admin display labels"
  ON public.admin_display_labels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- 2. auditions テーブルに admin_display_label_id を追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'auditions' 
    AND column_name = 'admin_display_label_id'
  ) THEN
    ALTER TABLE public.auditions 
      ADD COLUMN admin_display_label_id UUID 
      REFERENCES public.admin_display_labels(id) 
      ON DELETE SET NULL;
    
    COMMENT ON COLUMN public.auditions.admin_display_label_id IS 
      'Admin代理公開時の表示ラベルID（NULLの場合は通常主催者表示）';
  END IF;
END $$;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_auditions_admin_display_label_id 
  ON public.auditions(admin_display_label_id);

-- 3. 初期データ投入（基本的なラベル）
INSERT INTO public.admin_display_labels (label, description) VALUES
  ('castoオリジナル案件', 'castoが直接企画・運営するオーディション'),
  ('casto委託募集', '主催者から委託を受けcastoが掲載するオーディション'),
  ('パートナー企業募集', '提携企業からのオーディションをcastoが仲介')
ON CONFLICT (label) DO NOTHING;

COMMENT ON TABLE public.admin_display_labels IS 
  'Admin代理公開時の表示ラベル管理テーブル（Admin専用）';
