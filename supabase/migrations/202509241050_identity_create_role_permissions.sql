BEGIN;

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE public.role_permissions
  ADD CONSTRAINT role_permissions_role_id_fkey
  FOREIGN KEY (role_id)
  REFERENCES public.roles(id)
  ON DELETE CASCADE;

ALTER TABLE public.role_permissions
  ADD CONSTRAINT role_permissions_permission_id_fkey
  FOREIGN KEY (permission_id)
  REFERENCES public.permissions(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS role_permissions_created_by_idx ON public.role_permissions(created_by);

COMMENT ON TABLE public.role_permissions IS 'Identity domain: mapping of roles to permissions';
COMMENT ON COLUMN public.role_permissions.created_by IS 'User who granted permission (nullable)';

COMMIT;
