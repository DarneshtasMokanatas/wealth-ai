-- Add phone_number column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Allow users to update their own phone_number via existing update policy
-- (The existing "Users can update own profile" policy already covers all columns,
--  so no new policy is needed.)
