-- FinanceAI — Local development seed data
-- Do not run this script in staging or production.
-- Prerequisite: migrations 001_initial_schema.sql and 002_goal_contribution_atomic.sql

DO $$
DECLARE
  v_user_id UUID;
  v_goal_trip UUID;
  v_goal_emergency UUID;
  v_goal_laptop UUID;
BEGIN
  SELECT id
  INTO v_user_id
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users. Create an account first, then run this seed.';
  END IF;

  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (v_user_id, 'FinanceAI User', NULL)
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name;

  INSERT INTO transactions (user_id, description, amount, type, category, date)
  VALUES
    (v_user_id, 'Monthly Salary', 5200.00, 'income', 'income', CURRENT_DATE - INTERVAL '45 day'),
    (v_user_id, 'Monthly Salary', 5200.00, 'income', 'income', CURRENT_DATE - INTERVAL '15 day'),
    (v_user_id, 'Apartment Rent', 1400.00, 'expense', 'bills', CURRENT_DATE - INTERVAL '44 day'),
    (v_user_id, 'Apartment Rent', 1400.00, 'expense', 'bills', CURRENT_DATE - INTERVAL '14 day'),
    (v_user_id, 'Starbucks Latte', 6.50, 'expense', 'food', CURRENT_DATE - INTERVAL '13 day'),
    (v_user_id, 'Uber to Downtown', 18.75, 'expense', 'transport', CURRENT_DATE - INTERVAL '12 day'),
    (v_user_id, 'Netflix Subscription', 15.99, 'expense', 'entertainment', CURRENT_DATE - INTERVAL '10 day'),
    (v_user_id, 'Whole Foods Groceries', 87.50, 'expense', 'food', CURRENT_DATE - INTERVAL '9 day'),
    (v_user_id, 'Internet Bill', 65.00, 'expense', 'bills', CURRENT_DATE - INTERVAL '11 day'),
    (v_user_id, 'Freelance Design Payment', 850.00, 'income', 'income', CURRENT_DATE - INTERVAL '7 day'),
    (v_user_id, 'Gym Membership', 49.99, 'expense', 'health', CURRENT_DATE - INTERVAL '5 day'),
    (v_user_id, 'Udemy Course', 19.99, 'expense', 'education', CURRENT_DATE - INTERVAL '3 day'),
    (v_user_id, 'Savings Transfer', 500.00, 'expense', 'savings', CURRENT_DATE - INTERVAL '1 day');

  INSERT INTO goals (user_id, name, target_amount, current_amount, emoji, deadline)
  VALUES (v_user_id, 'Japan Trip', 3000.00, 750.00, '🗾', CURRENT_DATE + INTERVAL '180 day')
  RETURNING id INTO v_goal_trip;

  INSERT INTO goals (user_id, name, target_amount, current_amount, emoji, deadline)
  VALUES (v_user_id, 'Emergency Fund', 10000.00, 2200.00, '🏦', CURRENT_DATE + INTERVAL '365 day')
  RETURNING id INTO v_goal_emergency;

  INSERT INTO goals (user_id, name, target_amount, current_amount, emoji, deadline)
  VALUES (v_user_id, 'New Laptop', 2500.00, 550.00, '💻', CURRENT_DATE + INTERVAL '120 day')
  RETURNING id INTO v_goal_laptop;

  INSERT INTO goal_contributions (goal_id, user_id, amount)
  VALUES
    (v_goal_trip, v_user_id, 300.00),
    (v_goal_trip, v_user_id, 450.00),
    (v_goal_emergency, v_user_id, 1000.00),
    (v_goal_emergency, v_user_id, 1200.00),
    (v_goal_laptop, v_user_id, 250.00),
    (v_goal_laptop, v_user_id, 300.00);
END $$;
