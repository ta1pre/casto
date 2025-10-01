-- Enable RLS (Row Level Security) on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service Role (Workers API) only access policy
CREATE POLICY "Service role only access"
  ON users
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
