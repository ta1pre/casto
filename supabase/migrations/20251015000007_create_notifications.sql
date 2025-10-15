-- notifications テーブル定義 (DDL)
-- [CA][SFT] 通知管理（応募受付、合否決定など）

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ユーザーへの外部キー
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- 通知内容
  type TEXT NOT NULL, -- application_received, application_accepted, application_rejected, new_application, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- 関連レコード
  reference_type TEXT CHECK (reference_type IN ('audition', 'application')),
  reference_id UUID,
  
  -- 既読管理
  read_at TIMESTAMPTZ,
  
  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notifications_updated_at();

-- RLS（Row Level Security）を有効化
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ポリシー: 本人の通知のみ閲覧可能
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: 本人の通知のみ更新可能（既読管理）
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: システムが通知を作成可能（service_role経由）
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- ポリシー: 管理者は全ての通知を閲覧可能
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.notifications IS '通知管理テーブル';
COMMENT ON COLUMN public.notifications.type IS '通知タイプ（application_received, new_application, application_accepted, application_rejected, etc.）';
COMMENT ON COLUMN public.notifications.reference_type IS '関連レコードタイプ（audition/application）';
COMMENT ON COLUMN public.notifications.reference_id IS '関連レコードID';
COMMENT ON COLUMN public.notifications.read_at IS '既読日時（nullは未読）';
