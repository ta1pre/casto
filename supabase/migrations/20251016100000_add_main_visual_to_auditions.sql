-- オーディションメインビジュアル機能追加
-- [SF][CA] 画像・動画対応のメインビジュアルカラム追加

-- main_visual_url と main_visual_type カラムを追加
ALTER TABLE public.auditions
ADD COLUMN IF NOT EXISTS main_visual_url TEXT,
ADD COLUMN IF NOT EXISTS main_visual_type TEXT CHECK (main_visual_type IN ('image', 'video'));

-- コメント追加
COMMENT ON COLUMN public.auditions.main_visual_url IS 'メインビジュアルのURL（画像/動画、Workers経由配信）';
COMMENT ON COLUMN public.auditions.main_visual_type IS 'メディアタイプ（image/video）';
