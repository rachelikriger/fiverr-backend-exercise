-- Short Links MVP schema
-- Run on first DB startup (via docker-compose volume mount)

CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  seller_id VARCHAR(255) NOT NULL,
  target_url TEXT NOT NULL,
  short_code VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(seller_id, target_url),
  UNIQUE(short_code)
);

CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  is_valid BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_link_valid ON clicks(link_id, is_valid) WHERE is_valid = true;
