-- テーブルの存在確認
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('auditions', 'audition_genres', 'audition_genre_map')
ORDER BY tablename;

-- auditionsテーブルの列情報
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'auditions'
ORDER BY ordinal_position;
