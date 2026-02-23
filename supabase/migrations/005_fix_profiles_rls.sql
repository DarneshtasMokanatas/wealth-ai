-- FinanceAI — Fix missing RLS INSERT policy on profiles
-- Without this, new user profiles silently fail to insert (RLS blocks every
-- INSERT when no INSERT policy exists), which can lead to developers
-- disabling RLS entirely and exposing all rows.

-- Allow a user to insert exactly their own profile row
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tighten the UPDATE policy to also require the row id matches the caller
-- (belt-and-suspenders alongside the existing USING clause)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
