-- ポイントシステムのテーブルとRLSポリシーを作成
-- [SF][DRY][CA] - シンプル、重複排除、機能集約

CREATE TABLE IF NOT EXISTS public.points_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    account_type VARCHAR(50) NOT NULL DEFAULT 'organizer',
    balance INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_consumed INTEGER NOT NULL DEFAULT 0,
    total_bonus INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.points_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    related_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    related_audition_id UUID REFERENCES public.auditions(id) ON DELETE SET NULL,
    related_stripe_session_id VARCHAR(255),
    metadata JSONB,
    notes TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    price_jpy INTEGER NOT NULL,
    stripe_product_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    bonus_points INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.viewed_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
    points_consumed INTEGER NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, application_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'auditions' AND column_name = 'viewing_point_cost'
    ) THEN
        ALTER TABLE public.auditions ADD COLUMN viewing_point_cost INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'auditions' AND column_name = 'free_viewing_quota'
    ) THEN
        ALTER TABLE public.auditions ADD COLUMN free_viewing_quota INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'auditions' AND column_name = 'max_viewing_points'
    ) THEN
        ALTER TABLE public.auditions ADD COLUMN max_viewing_points INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'auditions' AND column_name = 'unlimited_viewing'
    ) THEN
        ALTER TABLE public.auditions ADD COLUMN unlimited_viewing BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'audition_genres' AND column_name = 'viewing_point_cost'
    ) THEN
        ALTER TABLE public.audition_genres ADD COLUMN viewing_point_cost INTEGER;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS points_transactions_account_created_at_idx
    ON public.points_transactions (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS viewed_applications_user_audition_idx
    ON public.viewed_applications (user_id, audition_id);

CREATE INDEX IF NOT EXISTS points_plans_display_order_idx
    ON public.points_plans (is_active, display_order);

ALTER TABLE public.points_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewed_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'points_accounts' AND policyname = 'Users can view own account'
    ) THEN
        CREATE POLICY "Users can view own account"
            ON public.points_accounts
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'points_accounts' AND policyname = 'Admins can view all accounts'
    ) THEN
        CREATE POLICY "Admins can view all accounts"
            ON public.points_accounts
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.user_roles ur
                    JOIN public.roles r ON ur.role_id = r.id
                    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'points_transactions' AND policyname = 'Users can view own transactions'
    ) THEN
        CREATE POLICY "Users can view own transactions"
            ON public.points_transactions
            FOR SELECT
            USING (
                account_id IN (
                    SELECT id FROM public.points_accounts WHERE user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'viewed_applications' AND policyname = 'Users can view own viewed applications'
    ) THEN
        CREATE POLICY "Users can view own viewed applications"
            ON public.viewed_applications
            FOR SELECT
            USING (user_id = auth.uid());
    END IF;
END;
$$;

DO $$
DECLARE
    default_cost_setting RECORD;
BEGIN
    SELECT * INTO default_cost_setting
    FROM public.system_settings
    WHERE key = 'default_viewing_point_cost';

    IF default_cost_setting IS NULL THEN
        INSERT INTO public.system_settings (key, value)
        VALUES ('default_viewing_point_cost', '100');
    END IF;
END;
$$;

UPDATE public.audition_genres SET viewing_point_cost = 2500 WHERE slug = 'job';
UPDATE public.audition_genres SET viewing_point_cost = 500 WHERE slug = 'movie';
UPDATE public.audition_genres SET viewing_point_cost = 800 WHERE slug = 'idol';
UPDATE public.audition_genres SET viewing_point_cost = 1000 WHERE slug = 'model';
UPDATE public.audition_genres SET viewing_point_cost = 1200 WHERE slug = 'actor';
