-- FinanceAI — Drop redundant index
-- idx_transactions_user (user_id) is fully covered by the composite
-- idx_transactions_user_date (user_id, date DESC) from migration 004.
-- Keeping the standalone index wastes disk space and slows writes.

DROP INDEX IF EXISTS idx_transactions_user;
