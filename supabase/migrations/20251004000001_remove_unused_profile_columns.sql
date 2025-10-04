-- 未使用のプロフィールカラムを削除
-- フォームUIで使用していないフィールドをDBから削除

ALTER TABLE public.talent_profiles 
  DROP COLUMN IF EXISTS can_move,
  DROP COLUMN IF EXISTS can_stay,
  DROP COLUMN IF EXISTS passport_status;

-- コメント
COMMENT ON TABLE public.talent_profiles IS 'タレント・モデルのプロフィール情報（フォーム項目のみ）';
