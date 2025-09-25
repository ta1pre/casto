BEGIN;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (user_id, role_id)
);

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_id_fkey
  FOREIGN KEY (role_id)
  REFERENCES public.roles(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS user_roles_assigned_by_idx ON public.user_roles(assigned_by);

COMMENT ON TABLE public.user_roles IS 'Identity domain: mapping of users to roles';
COMMENT ON COLUMN public.user_roles.assigned_by IS 'User who granted the role (nullable)';

COMMIT;
