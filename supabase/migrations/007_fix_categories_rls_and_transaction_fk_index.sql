-- Fix RLS init plan on categories — use (select auth.role()) instead of auth.role()
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Authenticated users can view categories"
  ON public.categories
  FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Add missing covering index for transactions_category_fkey
CREATE INDEX IF NOT EXISTS idx_transactions_category_id
  ON public.transactions (category);
