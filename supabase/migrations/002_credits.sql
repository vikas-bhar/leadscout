-- Credit balances, transactions, and helper functions

CREATE TABLE IF NOT EXISTS user_credits (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  total_credits       INT DEFAULT 20,
  used_credits        INT DEFAULT 0,
  available_credits   INT DEFAULT 20,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_credits_user_id_key UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('purchase','usage','refund','bonus')),
  credits_amount  INT NOT NULL,
  action          TEXT,
  description     TEXT,
  search_id       UUID,
  stripe_session  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_stripe_session_key
  ON credit_transactions (stripe_session)
  WHERE stripe_session IS NOT NULL;

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own credits" ON user_credits;
CREATE POLICY "Users own credits" ON user_credits
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own transactions" ON credit_transactions;
CREATE POLICY "Users own transactions" ON credit_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Allow authenticated and service_role to insert/read credits safely
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;
CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;
CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_credits INT)
RETURNS void AS $$
BEGIN
  UPDATE user_credits
  SET
    total_credits = total_credits + p_credits,
    available_credits = available_credits + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_credits INT)
RETURNS void AS $$
BEGIN
  UPDATE user_credits
  SET
    used_credits = used_credits + p_credits,
    available_credits = available_credits - p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id
  AND available_credits >= p_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION add_credits(UUID, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION deduct_credits(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT) TO service_role, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID := NEW.id;
  v_email TEXT := NEW.email;
  v_name TEXT := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_avatar TEXT := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL);
BEGIN
  -- 1. Ensure user profile exists
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (v_user_id, v_email, v_name, v_avatar)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();

  -- 2. Give 20 initial free credits on signup
  INSERT INTO public.user_credits (user_id, total_credits, used_credits, available_credits)
  VALUES (v_user_id, 20, 0, 20)
  ON CONFLICT (user_id) DO UPDATE SET
    total_credits = CASE WHEN public.user_credits.total_credits = 0 THEN 20 ELSE public.user_credits.total_credits END,
    available_credits = CASE WHEN public.user_credits.available_credits = 0 AND public.user_credits.used_credits = 0 THEN 20 ELSE public.user_credits.available_credits END,
    updated_at = NOW();

  -- 3. Log signup transaction if not already logged
  IF NOT EXISTS (
    SELECT 1 FROM public.credit_transactions 
    WHERE user_id = v_user_id AND action = 'signup'
  ) THEN
    INSERT INTO public.credit_transactions (user_id, type, credits_amount, action, description)
    VALUES (v_user_id, 'bonus', 20, 'signup', 'Free starter credits');
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user encountered error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions for trigger execution
GRANT ALL ON TABLE public.users TO postgres, service_role;
GRANT ALL ON TABLE public.user_credits TO postgres, service_role;
GRANT ALL ON TABLE public.credit_transactions TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
