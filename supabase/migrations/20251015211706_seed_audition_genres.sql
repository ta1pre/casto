-- Seed audition_genres table with initial data
-- Applied to remote database on 2025-10-15 21:17:06

INSERT INTO public.audition_genres (slug, display_name, category, description, sort_order, is_active) 
VALUES
  ('idol', 'アイドル', 'エンタメ', 'アイドルグループ・ソロアイドル', 10, true),
  ('model', 'モデル', 'ファッション', 'ファッションモデル・読者モデル', 20, true),
  ('actor', '俳優・女優', 'エンタメ', '映画・ドラマ・舞台', 30, true),
  ('dancer', 'ダンサー', 'エンタメ', 'ダンスパフォーマー', 40, true),
  ('singer', '歌手・ボーカル', 'エンタメ', 'シンガー・ボーカリスト', 50, true),
  ('voice_actor', '声優', 'エンタメ', 'アニメ・ゲーム・ナレーション', 60, true),
  ('mc_host', 'MC・司会', 'エンタメ', 'イベントMC・番組司会', 70, true),
  ('influencer', 'インフルエンサー', 'SNS', 'SNS・動画配信', 80, true),
  ('creator', 'クリエイター', 'クリエイティブ', '動画・写真・デザイン', 90, true),
  ('other', 'その他', 'その他', 'その他のジャンル', 100, true)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
