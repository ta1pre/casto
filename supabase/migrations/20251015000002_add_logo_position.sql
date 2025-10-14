-- 主催者プロフィール: ロゴ位置調整機能追加
-- [SF][CA] 画像の表示位置を保存

-- 位置情報カラムを追加
ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS logo_position_x INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS logo_position_y INTEGER DEFAULT 0;

-- コメント追加
COMMENT ON COLUMN public.organizer_profiles.logo_position_x IS 'ロゴ画像のX軸位置（-100〜100、パーセント）';
COMMENT ON COLUMN public.organizer_profiles.logo_position_y IS 'ロゴ画像のY軸位置（-100〜100、パーセント）';
