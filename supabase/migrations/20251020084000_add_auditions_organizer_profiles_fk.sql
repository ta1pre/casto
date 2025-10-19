-- auditions と organizer_profiles の外部キー整合性を付与
-- [SF][REH][CA] シンプルで堅牢なデータ整合性

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'auditions_organizer_profiles_fk'
  ) THEN
    ALTER TABLE public.auditions
      ADD CONSTRAINT auditions_organizer_profiles_fk
      FOREIGN KEY (organizer_id)
      REFERENCES public.organizer_profiles(organizer_id)
      ON DELETE CASCADE;
  END IF;
END
$$;
