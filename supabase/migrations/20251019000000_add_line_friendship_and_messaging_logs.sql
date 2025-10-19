-- LINE公式アカウント統合 Phase 2: Webhook連携 + DB保存
-- [SF][CA][DRY] シンプル、クリーンアーキテクチャ、重複排除

-- 1. users テーブルに LINE 友だち追加状態カラムを追加
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS line_friendship_status BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS line_friendship_updated_at TIMESTAMPTZ;

-- インデックス追加（友だち追加済みユーザーの検索を高速化）
CREATE INDEX IF NOT EXISTS idx_users_line_friendship 
ON public.users(line_friendship_status) 
WHERE line_friendship_status = true;

-- 2. messaging_logs テーブル（Messaging API送信履歴）
CREATE TABLE IF NOT EXISTS public.messaging_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL CHECK (message_type IN (
    'audition_announcement',
    'weekly_summary',
    'custom'
  )),
  recipient_count INTEGER NOT NULL CHECK (recipient_count >= 0),
  success_count INTEGER NOT NULL CHECK (success_count >= 0),
  failed_count INTEGER NOT NULL CHECK (failed_count >= 0),
  message_content JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- messaging_logs インデックス
CREATE INDEX IF NOT EXISTS idx_messaging_logs_sent_at 
ON public.messaging_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messaging_logs_sent_by 
ON public.messaging_logs(sent_by);

-- 3. RLS ポリシー設定

-- messaging_logs: 管理者のみ閲覧可能
ALTER TABLE public.messaging_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧
CREATE POLICY "Admins can view all messaging logs"
ON public.messaging_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id IN (
      SELECT id FROM public.roles WHERE name = 'admin'
    )
  )
);

-- 管理者のみ挿入
CREATE POLICY "Admins can insert messaging logs"
ON public.messaging_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_id IN (
      SELECT id FROM public.roles WHERE name = 'admin'
    )
  )
);

-- コメント
COMMENT ON COLUMN public.users.line_friendship_status IS 'LINE公式アカウント友だち追加状態（true: 追加済み, false: ブロック/解除, null: 不明）';
COMMENT ON COLUMN public.users.line_friendship_updated_at IS 'LINE友だち追加状態最終更新日時';
COMMENT ON TABLE public.messaging_logs IS 'LINE Messaging API送信履歴';
COMMENT ON COLUMN public.messaging_logs.message_type IS 'メッセージタイプ（audition_announcement: 新着告知, weekly_summary: 週次まとめ, custom: カスタム）';
