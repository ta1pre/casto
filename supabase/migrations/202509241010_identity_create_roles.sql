BEGIN;

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS 'Identity domain: role master';
COMMENT ON COLUMN public.roles.name IS 'Stable role key (e.g. applicant, organizer, admin)';
COMMENT ON COLUMN public.roles.display_name IS 'Human-readable role label';

COMMIT;
