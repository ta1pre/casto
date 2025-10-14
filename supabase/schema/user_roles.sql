-- ユーザーロール中間テーブル
-- [CA][SFT] 1ユーザーが複数のロールを持てるようにする多対多の関係

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- RLS（Row Level Security）を有効化
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ポリシー: 認証済みユーザーは自身のロールを参照可能
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: Service Role（Workers API）のみ全操作可能
DROP POLICY IF EXISTS "Service role only access" ON public.user_roles;
CREATE POLICY "Service role only access"
  ON public.user_roles
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- コメント
COMMENT ON TABLE public.user_roles IS 'ユーザーとロールの中間テーブル（多対多）';
COMMENT ON COLUMN public.user_roles.user_id IS 'ユーザーID（usersテーブル外部キー）';
COMMENT ON COLUMN public.user_roles.role_id IS 'ロールID（rolesテーブル外部キー）';
COMMENT ON COLUMN public.user_roles.assigned_at IS 'ロール付与日時';
