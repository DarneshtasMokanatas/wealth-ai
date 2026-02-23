-- FinanceAI — Production hardening constraints and indexes

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_amount_positive'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_description_not_blank'
  ) THEN
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_description_not_blank
      CHECK (length(trim(description)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_target_amount_positive'
  ) THEN
    ALTER TABLE goals
      ADD CONSTRAINT goals_target_amount_positive
      CHECK (target_amount > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_current_amount_non_negative'
  ) THEN
    ALTER TABLE goals
      ADD CONSTRAINT goals_current_amount_non_negative
      CHECK (current_amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_current_lte_target'
  ) THEN
    ALTER TABLE goals
      ADD CONSTRAINT goals_current_lte_target
      CHECK (current_amount <= target_amount);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_name_not_blank'
  ) THEN
    ALTER TABLE goals
      ADD CONSTRAINT goals_name_not_blank
      CHECK (length(trim(name)) > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goal_contributions_amount_positive'
  ) THEN
    ALTER TABLE goal_contributions
      ADD CONSTRAINT goal_contributions_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category
  ON transactions (user_id, category);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_created
  ON goal_contributions (user_id, created_at DESC);
