-- クリーンアップSQL
-- Supabase Dashboard → SQL Editor で実行
-- 既存のテーブルとマイグレーション履歴をすべて削除

-- 既存テーブル削除
DROP TABLE IF EXISTS viewing_history CASCADE;
DROP TABLE IF EXISTS applicant_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- マイグレーション履歴削除
DELETE FROM supabase_migrations.schema_migrations 
WHERE version IN (
  '001', 
  '202509241000', 
  '202509241010', 
  '202509241020', 
  '202509241030', 
  '202509241040', 
  '202509241050', 
  '20250130'
);

-- トリガー関数も削除
DROP FUNCTION IF EXISTS update_applicant_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_users_updated_at() CASCADE;
