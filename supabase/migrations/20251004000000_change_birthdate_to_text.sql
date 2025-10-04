-- 生年月日フィールドをDATE型からTEXT型に変更
-- 部分的な日付（YYYY、YYYY-MM、YYYY-MM-DD）を許可するため

-- 既存データをTEXT形式に変換してから型変更
ALTER TABLE public.talent_profiles 
  ALTER COLUMN birthdate DROP NOT NULL,
  ALTER COLUMN birthdate TYPE TEXT USING birthdate::TEXT;

-- コメント更新
COMMENT ON COLUMN public.talent_profiles.birthdate IS '生年月日（YYYY、YYYY-MM、またはYYYY-MM-DD形式、任意）';
