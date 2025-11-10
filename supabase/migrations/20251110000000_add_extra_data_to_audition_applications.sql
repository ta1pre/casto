-- audition_applicationsテーブルにextra_application_dataカラムを追加
-- [SF][CA] エキストラ募集時の応募追加情報を保存

DO $$ 
BEGIN
  -- extra_application_dataカラムを追加
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audition_applications' 
    AND column_name = 'extra_application_data'
  ) THEN
    ALTER TABLE public.audition_applications 
      ADD COLUMN extra_application_data JSONB DEFAULT '{}'::jsonb;
    
    -- コメント追加
    COMMENT ON COLUMN public.audition_applications.extra_application_data IS '応募時の種別固有データ（エキストラ: 追加メモなど）';
    
    -- GINインデックス追加（JSONB検索の高速化）
    CREATE INDEX idx_audition_applications_extra_data 
      ON public.audition_applications USING gin (extra_application_data);
  END IF;
END $$;
