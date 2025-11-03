-- ポイントプランテーブルの更新: discount_rate削除 + bonus_points追加
-- [SF][DRY] - シンプルで重複のない設計

-- bonus_pointsカラム追加（デフォルト0、任意のおまけポイント）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'points_plans' AND column_name = 'bonus_points'
    ) THEN
        ALTER TABLE public.points_plans ADD COLUMN bonus_points INTEGER NOT NULL DEFAULT 0;
    END IF;
END;
$$;

-- discount_rateカラム削除（旧仕様、不要）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'points_plans' AND column_name = 'discount_rate'
    ) THEN
        ALTER TABLE public.points_plans DROP COLUMN discount_rate;
    END IF;
END;
$$;
