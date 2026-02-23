-- FinanceAI — Placeholder migration to keep historical migration order intact.
-- Dummy seed data has been moved to supabase/seed.local.sql and must never run in production.

DO $$
BEGIN
  RAISE NOTICE 'Skipping 003_seed_dummy_data.sql. Use supabase/seed.local.sql for local development only.';
END $$;
