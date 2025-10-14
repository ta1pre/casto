-- 主催者プロフィール: 住所を都道府県と詳細に分割
-- [CA][SF] 都道府県選択機能の追加

-- 1. 新しいカラムを追加
ALTER TABLE public.organizer_profiles
  ADD COLUMN IF NOT EXISTS prefecture TEXT,
  ADD COLUMN IF NOT EXISTS address_detail TEXT;

-- 2. 既存データを移行
-- addressの内容をaddress_detailにコピー、prefectureは空文字列で初期化
UPDATE public.organizer_profiles
SET 
  address_detail = COALESCE(address, ''),
  prefecture = ''
WHERE address_detail IS NULL OR prefecture IS NULL;

-- 3. 古いカラムを削除
ALTER TABLE public.organizer_profiles
  DROP COLUMN IF EXISTS address;

-- 4. NOT NULL制約を追加
ALTER TABLE public.organizer_profiles
  ALTER COLUMN prefecture SET NOT NULL,
  ALTER COLUMN address_detail SET NOT NULL;

-- 5. インデックス追加（都道府県での検索用）
CREATE INDEX IF NOT EXISTS idx_organizer_profiles_prefecture ON public.organizer_profiles(prefecture);

-- コメント更新
COMMENT ON COLUMN public.organizer_profiles.prefecture IS '都道府県';
COMMENT ON COLUMN public.organizer_profiles.address_detail IS '都道府県以降の住所';
