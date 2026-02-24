-- ─── Recurring columns on transactions ───────────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_recurring  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence    TEXT    CHECK (recurrence IN ('weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- Enforce: if is_recurring = true then recurrence and next_due_date must be set
ALTER TABLE transactions
  ADD CONSTRAINT chk_recurring_fields
    CHECK (
      (is_recurring = false)
      OR (is_recurring = true AND recurrence IS NOT NULL AND next_due_date IS NOT NULL)
    );

-- Index for the cron query (fast lookup of due recurring transactions)
CREATE INDEX IF NOT EXISTS idx_transactions_recurring
  ON transactions (is_recurring, next_due_date)
  WHERE is_recurring = true;

-- Add missing UPDATE policy (transactions previously only had SELECT/INSERT/DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'transactions'
      AND policyname = 'Users can update their own transactions'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update their own transactions"
        ON transactions FOR UPDATE
        USING      ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id)
    $policy$;
  END IF;
END $$;
