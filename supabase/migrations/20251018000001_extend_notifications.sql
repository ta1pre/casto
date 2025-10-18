-- notifications テーブル拡張
-- [CA][SFT] サービスメッセージ対応のためのカラム追加

-- context カラム: テンプレート変数を格納
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS context JSONB;

-- channel カラム: 通知チャネル（line/email/in_app）
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS channel TEXT;

-- service_notification_token カラム: LINEサービス通知トークン（後続メッセージ用）
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS service_notification_token TEXT;

-- インデックス追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_notifications_channel 
ON public.notifications(channel) 
WHERE channel IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_service_token 
ON public.notifications(service_notification_token) 
WHERE service_notification_token IS NOT NULL;

-- コメント追加
COMMENT ON COLUMN public.notifications.context IS 'テンプレート変数（auditionTitle, applicationId等）';
COMMENT ON COLUMN public.notifications.channel IS '通知チャネル（line/email/in_app）';
COMMENT ON COLUMN public.notifications.service_notification_token IS 'LINEサービス通知トークン（後続メッセージ送信用）';
