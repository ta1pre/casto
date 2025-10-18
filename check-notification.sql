-- 最新の通知レコードを確認
SELECT 
  id,
  user_id,
  type,
  title,
  channel,
  context,
  service_notification_token IS NOT NULL as has_token,
  created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 5;
