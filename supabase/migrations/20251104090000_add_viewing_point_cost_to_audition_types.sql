-- 種別ごとの閲覧単価設定を追加
-- [SF][CA][REH] シンプルなカラム追加とべき等性保証

ALTER TABLE public.audition_types
  ADD COLUMN IF NOT EXISTS viewing_point_cost INTEGER CHECK (viewing_point_cost >= 0);

COMMENT ON COLUMN public.audition_types.viewing_point_cost IS '種別ごとのデフォルト閲覧単価（NULL=ジャンル/デフォルトへフォールバック）';

-- 既存種別の初期値は NULL（既存のジャンル/デフォルト設定を優先）
-- 将来的に管理画面から設定可能
