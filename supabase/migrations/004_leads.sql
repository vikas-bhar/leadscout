-- Discovered leads from searches

CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id             UUID REFERENCES searches(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  rank                  INT,
  business_name         TEXT NOT NULL,
  business_category     TEXT,
  location              TEXT,
  google_rating         DECIMAL(2,1),
  review_count          INT,
  has_website           BOOLEAN DEFAULT FALSE,
  website_url           TEXT,
  phone                 TEXT,
  photo_count           INT DEFAULT 0,
  maps_url              TEXT,
  instagram_handle      TEXT,
  instagram_followers   INT,
  instagram_following   INT,
  instagram_posts       INT,
  last_post_date        TEXT,
  engagement_rate       DECIMAL(5,2),
  has_link_in_bio       BOOLEAN,
  uses_reels            BOOLEAN,
  opportunity_score     INT DEFAULT 0,
  urgency_level         TEXT DEFAULT 'low',
  gaps_found            JSONB,
  best_service          TEXT,
  secondary_services    TEXT[],
  buying_signals        TEXT[],
  pitches               JSONB,
  estimated_budget      TEXT,
  status                TEXT DEFAULT 'new',
  notes                 TEXT,
  contacted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own leads" ON leads;
CREATE POLICY "Users own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS leads_user_id_score_idx
  ON leads (user_id, opportunity_score DESC);

CREATE INDEX IF NOT EXISTS leads_search_id_idx
  ON leads (search_id);
