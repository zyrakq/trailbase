CREATE TABLE IF NOT EXISTS subscriptions (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  logo_url      TEXT NOT NULL DEFAULT '',
  resource_url  TEXT NOT NULL DEFAULT '',
  what_included TEXT NOT NULL DEFAULT '',
  terms         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
) STRICT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
