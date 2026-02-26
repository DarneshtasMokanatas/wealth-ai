-- FinanceAI — Fix categories RLS to use (SELECT auth.uid())
-- Migration 006 standardised all tables to use the subquery form
-- (SELECT auth.uid()) to avoid repeated init-plan evaluation per row.
-- The categories INSERT/UPDATE/DELETE policies from migration 011
-- were missed and still use the bare auth.uid() call.

-- INSERT
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- DELETE
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (user_id = (SELECT auth.uid()));
