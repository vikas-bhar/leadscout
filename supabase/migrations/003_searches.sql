-- Search jobs table

CREATE TABLE IF NOT EXISTS searches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  location          TEXT NOT NULL,
  business_type     TEXT NOT NULL,
  freelancer_type   TEXT NOT NULL,
  status            TEXT DEFAULT 'pending',
  progress          INT DEFAULT 0,
  progress_message  TEXT,
  results_count     INT DEFAULT 0,
  credits_used      INT DEFAULT 0,
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own searches" ON searches;
CREATE POLICY "Users own searches" ON searches
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS searches_user_id_created_at_idx
  ON searches (user_id, created_at DESC);
