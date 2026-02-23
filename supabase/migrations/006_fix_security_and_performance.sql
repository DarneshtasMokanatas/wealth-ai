-- ============================================================
-- 1. SECURITY: Enable RLS on categories table
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- categories is shared reference data — all authenticated users can read
CREATE POLICY "Authenticated users can view categories"
  ON public.categories
  FOR SELECT
  USING (auth.role() = 'authenticated');


-- ============================================================
-- 2. SECURITY: Fix mutable search_path on add_goal_contribution
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_goal_contribution(p_goal_id uuid, p_amount numeric)
  RETURNS TABLE(current_amount numeric)
  LANGUAGE plpgsql
  SET search_path = public
AS $$
DECLARE
  updated_amount NUMERIC;
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  UPDATE goals
  SET current_amount = LEAST(target_amount, current_amount + p_amount)
  WHERE id = p_goal_id
    AND user_id = current_user_id
  RETURNING goals.current_amount INTO updated_amount;

  IF updated_amount IS NULL THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  INSERT INTO goal_contributions (goal_id, user_id, amount)
  VALUES (p_goal_id, current_user_id, p_amount);

  RETURN QUERY SELECT updated_amount;
END;
$$;


-- ============================================================
-- 3. PERFORMANCE: Fix RLS init plan — profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);


-- ============================================================
-- 4. PERFORMANCE: Fix RLS init plan — transactions
-- ============================================================
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING ((select auth.uid()) = user_id);


-- ============================================================
-- 5. PERFORMANCE: Fix RLS init plan — goals
-- ============================================================
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING ((select auth.uid()) = user_id);


-- ============================================================
-- 6. PERFORMANCE: Fix RLS init plan — goal_contributions
-- ============================================================
DROP POLICY IF EXISTS "Users can view own contributions" ON public.goal_contributions;
CREATE POLICY "Users can view own contributions"
  ON public.goal_contributions FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own contributions" ON public.goal_contributions;
CREATE POLICY "Users can insert own contributions"
  ON public.goal_contributions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);


-- ============================================================
-- 7. PERFORMANCE: Add missing indexes on goal_contributions FKs
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id
  ON public.goal_contributions (goal_id);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id
  ON public.goal_contributions (user_id);


-- ============================================================
-- 8. PERFORMANCE: Drop unused indexes on transactions
-- ============================================================
DROP INDEX IF EXISTS public.idx_transactions_date;
DROP INDEX IF EXISTS public.idx_transactions_category;
