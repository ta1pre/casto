-- 応募ステータスに「未開封」を追加
-- [SF][CA] 将来のポイント消費機能を見越した実装

-- overall_statusに'unread'を追加
ALTER TABLE public.audition_applications 
DROP CONSTRAINT IF EXISTS audition_applications_overall_status_check;

ALTER TABLE public.audition_applications 
ADD CONSTRAINT audition_applications_overall_status_check 
CHECK (overall_status IN ('unread', 'pending', 'in_progress', 'passed', 'rejected', 'withdrawn'));

-- コメント
COMMENT ON COLUMN public.audition_applications.overall_status IS '応募全体ステータス（unread=未開封, pending=未審査, in_progress=審査中, passed=合格, rejected=不合格, withdrawn=辞退）';
