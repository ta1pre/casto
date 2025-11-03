-- 種別ごとの無料閲覧数設定を追加
-- [SF][CA][REH] シンプルなカラム追加と既存データ更新

ALTER TABLE public.audition_types
  ADD COLUMN IF NOT EXISTS free_view_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.audition_types.free_view_count IS '無料で閲覧できる応募者数（0の場合は全員課金）';

-- 既存種別の初期値を設定
UPDATE public.audition_types
SET free_view_count = CASE type_code
  WHEN 'audition' THEN 5
  WHEN 'job' THEN 10
  WHEN 'extra' THEN 50
  ELSE 0
END;
