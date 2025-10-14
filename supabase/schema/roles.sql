-- ロールマスタテーブル
-- [CA][SFT] ユーザーが持つ権限の種類を定義

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('admin', 'organizer', 'talent', 'fan')),
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- 初期データ挿入
INSERT INTO public.roles (name, display_name, description) VALUES
  ('admin', '運営管理者', 'システム全体を管理する運営サイド'),
  ('organizer', '主催者', 'オーディション・クラファンを企画・管理する事業者'),
  ('talent', 'タレント', 'オーディションに応募するタレント・モデル'),
  ('fan', 'ファン', '一般ユーザー・支援者')
ON CONFLICT (name) DO NOTHING;

-- RLS（Row Level Security）を有効化
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全ユーザーが参照可能（マスタデータのため）
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles"
  ON public.roles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- コメント
COMMENT ON TABLE public.roles IS 'ロールマスタテーブル（admin, organizer, talent, fan）';
COMMENT ON COLUMN public.roles.name IS 'ロール名（システム内部で使用）';
COMMENT ON COLUMN public.roles.display_name IS 'ロール表示名（UI表示用）';
