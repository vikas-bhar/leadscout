-- Migration: Fix handle_new_user trigger and grant 20 credits on signup
-- Run this directly in Supabase SQL Editor if needed.

-- 1. Ensure user_credits policies allow inserts
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;
CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Enhanced handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID := NEW.id;
  v_email TEXT := NEW.email;
  v_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_avatar TEXT := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL);
BEGIN
  -- Insert or update user profile
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (v_user_id, v_email, v_name, v_avatar)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

  -- Grant 20 credits to user_credits
  INSERT INTO public.user_credits (user_id, total_credits, used_credits, available_credits)
  VALUES (v_user_id, 20, 0, 20)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = CASE WHEN public.user_credits.total_credits = 0 THEN 20 ELSE public.user_credits.total_credits END,
    available_credits = CASE WHEN public.user_credits.available_credits = 0 AND public.user_credits.used_credits = 0 THEN 20 ELSE public.user_credits.available_credits END,
    updated_at = NOW();

  -- Insert bonus transaction
  IF NOT EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = v_user_id AND action = 'signup'
  ) THEN
    INSERT INTO public.credit_transactions (user_id, type, credits_amount, action, description)
    VALUES (v_user_id, 'bonus', 20, 'signup', 'Free starter credits');
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill any existing users who have 0 credits or missing user_credits row
INSERT INTO public.user_credits (user_id, total_credits, used_credits, available_credits)
SELECT id, 20, 0, 20 FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET
  total_credits = CASE WHEN public.user_credits.total_credits = 0 THEN 20 ELSE public.user_credits.total_credits END,
  available_credits = CASE WHEN public.user_credits.available_credits = 0 AND public.user_credits.used_credits = 0 THEN 20 ELSE public.user_credits.available_credits END;
