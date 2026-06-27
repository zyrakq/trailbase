CREATE TABLE IF NOT EXISTS subscription_events (
  id                   TEXT PRIMARY KEY,
  user_subscription_id TEXT NOT NULL REFERENCES user_subscriptions(id),
  event_type           TEXT NOT NULL,
  created_at           INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata             TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_sub
  ON subscription_events(user_subscription_id);
