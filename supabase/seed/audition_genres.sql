-- audition_genres テーブルの初期データ投入
-- [SF][CA] オーディション・求人の標準ジャンルマスタ

-- 既存データをクリア（開発環境のみ）
TRUNCATE TABLE public.audition_genres RESTART IDENTITY CASCADE;

-- 初期ジャンルデータ投入（3つのみ）
INSERT INTO public.audition_genres (slug, display_name, category, description, sort_order, is_active) VALUES
  ('idol', 'アイドル', 'エンタメ', 'アイドルグループ・ソロアイドル', 10, true),
  ('model', 'モデル', 'ファッション', 'ファッションモデル・読者モデル', 20, true),
  ('actor', '俳優・女優', 'エンタメ', '映画・ドラマ・舞台', 30, true);

-- 確認用クエリ（コメントアウト）
-- SELECT * FROM public.audition_genres ORDER BY sort_order;
