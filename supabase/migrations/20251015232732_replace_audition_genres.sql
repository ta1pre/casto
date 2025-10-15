-- audition_genres を「所属」「出演」「SNS完結」の3種類に再編
-- [SF][CA][DRY] 既存データをリセットして新マスタに入れ替え

BEGIN;

-- 関連付けを先に削除（参照整合性を保つ）
DELETE FROM public.audition_genre_map;

-- 既存ジャンルを削除
DELETE FROM public.audition_genres;

-- 新しいジャンルを登録（べき等性のため ON CONFLICT 付き）
INSERT INTO public.audition_genres (slug, display_name, category, description, sort_order, is_active)
VALUES
  ('belonging', '所属', '所属', '所属・契約を目的とした募集案件', 10, true),
  ('appearance', '出演', '出演', '番組・イベントへの出演を目的とした募集案件', 20, true),
  ('sns_completed', 'SNS完結', 'SNS完結', 'SNS上で完結する案件（ライブ配信・投稿依頼など）', 30, true)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
