BEGIN;

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.permissions IS 'Identity domain: permission master definitions';
COMMENT ON COLUMN public.permissions.name IS 'Stable permission key (e.g. manage_auditions)';

COMMIT;
