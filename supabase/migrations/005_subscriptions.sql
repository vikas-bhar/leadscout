-- Subscription table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  monthly_credits INT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom prompts table
CREATE TABLE IF NOT EXISTS custom_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt_type TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  analysis_prompt TEXT NOT NULL,
  pitch_prompt TEXT NOT NULL,
  scoring_criteria JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom filters table
CREATE TABLE IF NOT EXISTS custom_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL,
  scraping_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved search templates
CREATE TABLE IF NOT EXISTS search_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  custom_prompt_id UUID REFERENCES custom_prompts(id),
  custom_filter_id UUID REFERENCES custom_filters(id),
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  subscription_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  custom_prompts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  max_seats INT DEFAULT 1;

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own subscriptions"
  ON subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own custom prompts"
  ON custom_prompts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own custom filters"
  ON custom_filters FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users own search templates"
  ON search_templates FOR ALL
  USING (auth.uid() = user_id);

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits(
  p_user_id UUID,
  p_monthly_credits INT,
  p_rollover INT DEFAULT 0
)
RETURNS void AS $$
DECLARE
  current_available INT;
BEGIN
  SELECT available_credits INTO current_available
  FROM user_credits
  WHERE user_id = p_user_id;

  -- Add rollover (unused credits carry over up to limit)
  UPDATE user_credits SET
    total_credits = p_monthly_credits +
      LEAST(current_available, p_rollover),
    available_credits = p_monthly_credits +
      LEAST(current_available, p_rollover),
    used_credits = 0,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
