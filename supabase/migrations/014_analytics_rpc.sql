-- ─── Analytics RPC Functions (AC-2) ─────────────────────────────────────────
-- Push all grouping/summing into Postgres. All use SECURITY INVOKER + auth.uid().

-- 1. Dashboard stats
CREATE OR REPLACE FUNCTION dashboard_stats()
RETURNS TABLE (
  total_income NUMERIC, total_expenses NUMERIC,
  monthly_income NUMERIC, monthly_expenses NUMERIC,
  burn_rate NUMERIC, savings_rate NUMERIC
)
LANGUAGE sql SECURITY INVOKER AS $$
  WITH agg AS (
    SELECT
      COALESCE(SUM(CASE WHEN type='income'  THEN amount      ELSE 0 END),0) AS total_income,
      COALESCE(SUM(CASE WHEN type='expense' THEN ABS(amount) ELSE 0 END),0) AS total_expenses,
      COALESCE(SUM(CASE WHEN type='income'  AND date_trunc('month',date::timestamp)=date_trunc('month',NOW()) THEN amount      ELSE 0 END),0) AS monthly_income,
      COALESCE(SUM(CASE WHEN type='expense' AND date_trunc('month',date::timestamp)=date_trunc('month',NOW()) THEN ABS(amount) ELSE 0 END),0) AS monthly_expenses
    FROM transactions WHERE user_id=auth.uid()
  )
  SELECT total_income::NUMERIC, total_expenses::NUMERIC, monthly_income::NUMERIC, monthly_expenses::NUMERIC,
    CASE WHEN EXTRACT(DAY FROM NOW())>0 THEN (monthly_expenses/EXTRACT(DAY FROM NOW()))::NUMERIC ELSE 0 END,
    CASE WHEN monthly_income>0 THEN ((monthly_income-monthly_expenses)/monthly_income*100)::NUMERIC ELSE 0 END
  FROM agg
$$;

-- 2. Monthly trend (month_label matches JS toLocaleString('en-MY',{month:'short',year:'numeric'}))
CREATE OR REPLACE FUNCTION analytics_monthly_trend(p_months INT DEFAULT 6)
RETURNS TABLE (month_label TEXT, income NUMERIC, expenses NUMERIC, net NUMERIC)
LANGUAGE sql SECURITY INVOKER AS $$
  WITH buckets AS (SELECT generate_series(p_months-1,0,-1) AS off),
  ms AS (SELECT date_trunc('month',NOW()-(off*INTERVAL'1 month'))::date AS s FROM buckets)
  SELECT to_char(ms.s,'Mon YYYY')::TEXT,
    COALESCE(SUM(CASE WHEN t.type='income'  THEN t.amount      ELSE 0 END),0)::NUMERIC,
    COALESCE(SUM(CASE WHEN t.type='expense' THEN ABS(t.amount) ELSE 0 END),0)::NUMERIC,
    COALESCE(SUM(CASE WHEN t.type='income'  THEN t.amount ELSE -ABS(t.amount) END),0)::NUMERIC
  FROM ms LEFT JOIN transactions t ON t.user_id=auth.uid() AND date_trunc('month',t.date::timestamp)=ms.s::timestamp
  GROUP BY ms.s ORDER BY ms.s ASC
$$;

-- 3. Day-of-week spending (DOW: 0=Sun...6=Sat; missing days absent, JS fills zeros)
CREATE OR REPLACE FUNCTION analytics_day_of_week()
RETURNS TABLE (dow INT, total NUMERIC, tx_count INT)
LANGUAGE sql SECURITY INVOKER AS $$
  SELECT EXTRACT(DOW FROM date::timestamp)::INT, SUM(ABS(amount))::NUMERIC, COUNT(*)::INT
  FROM transactions WHERE user_id=auth.uid() AND type='expense'
  GROUP BY EXTRACT(DOW FROM date::timestamp) ORDER BY 1
$$;

-- 4. Category month-over-month
CREATE OR REPLACE FUNCTION analytics_category_mom()
RETURNS TABLE (category_id TEXT, current_total NUMERIC, previous_total NUMERIC)
LANGUAGE sql SECURITY INVOKER AS $$
  WITH cur  AS (SELECT category,SUM(ABS(amount)) t FROM transactions WHERE user_id=auth.uid() AND type='expense' AND date_trunc('month',date::timestamp)=date_trunc('month',NOW())              GROUP BY category),
       prev AS (SELECT category,SUM(ABS(amount)) t FROM transactions WHERE user_id=auth.uid() AND type='expense' AND date_trunc('month',date::timestamp)=date_trunc('month',NOW()-INTERVAL'1 month') GROUP BY category)
  SELECT COALESCE(c.category,p.category)::TEXT, COALESCE(c.t,0)::NUMERIC, COALESCE(p.t,0)::NUMERIC
  FROM cur c FULL OUTER JOIN prev p ON c.category=p.category
  WHERE COALESCE(c.t,0)>0 OR COALESCE(p.t,0)>0 ORDER BY COALESCE(c.t,0) DESC
$$;

-- 5. All-time category spending (for AI top-categories + breakdown chart)
CREATE OR REPLACE FUNCTION analytics_category_spending()
RETURNS TABLE (category_id TEXT, total NUMERIC)
LANGUAGE sql SECURITY INVOKER AS $$
  SELECT category::TEXT, SUM(ABS(amount))::NUMERIC
  FROM transactions WHERE user_id=auth.uid() AND type='expense'
  GROUP BY category ORDER BY 2 DESC
$$;

-- Grants
GRANT EXECUTE ON FUNCTION dashboard_stats()             TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_monthly_trend(INT)  TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_day_of_week()       TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_category_mom()      TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_category_spending() TO authenticated;
