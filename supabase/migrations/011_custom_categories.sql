-- FinanceAI — Custom Categories
-- Extends the categories table to support per-user custom categories.

-- ─── 1. Add user_id (NULL = system/built-in) ─────────────────────────────────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── 2. Add type column ───────────────────────────────────────────────────────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'expense'
  CHECK (type IN ('expense', 'income', 'savings'));

-- ─── 3. Stamp the correct types on existing system rows ──────────────────────
UPDATE categories SET type = 'income'  WHERE id = 'income'  AND user_id IS NULL;
UPDATE categories SET type = 'savings' WHERE id = 'savings' AND user_id IS NULL;
-- All other system rows stay at the DEFAULT 'expense'

-- ─── 4. Unique index — prevent a user from creating duplicate names ───────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name
  ON categories (user_id, lower(name))
  WHERE user_id IS NOT NULL;

-- ─── 5. Update RLS ────────────────────────────────────────────────────────────

-- SELECT: authenticated users can see system categories OR their own
DROP POLICY IF EXISTS "Authenticated users can view categories" ON categories;
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (
    (SELECT auth.role()) = 'authenticated'
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

-- INSERT: users can only insert rows where user_id = their own uid
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: users can only update their own custom categories
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: users can only delete their own custom categories
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (user_id = auth.uid());
