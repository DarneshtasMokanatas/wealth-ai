CREATE OR REPLACE FUNCTION public.add_goal_contribution(
  p_goal_id UUID,
  p_amount NUMERIC
)
RETURNS TABLE(current_amount NUMERIC)
LANGUAGE plpgsql
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
