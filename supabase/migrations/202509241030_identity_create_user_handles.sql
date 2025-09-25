BEGIN;

CREATE TABLE IF NOT EXISTS public.user_handles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('line', 'email')),
  handle text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, handle)
);

ALTER TABLE public.user_handles
  ADD CONSTRAINT user_handles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_handles_user_id_idx ON public.user_handles(user_id);
CREATE INDEX IF NOT EXISTS user_handles_provider_idx ON public.user_handles(provider);

COMMENT ON TABLE public.user_handles IS 'Identity domain: authentication handles per user';
COMMENT ON COLUMN public.user_handles.provider IS 'Handle provider (e.g. line, email)';
COMMENT ON COLUMN public.user_handles.handle IS 'Provider-specific identifier';

COMMIT;
