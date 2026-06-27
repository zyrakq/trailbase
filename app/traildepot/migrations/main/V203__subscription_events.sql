CREATE TABLE IF NOT EXISTS subscription_events (
  id                   BLOB PRIMARY KEY NOT NULL CHECK(is_uuid_v4(id)) DEFAULT (uuid_v4()),
  user_subscription_id BLOB NOT NULL REFERENCES user_subscriptions(id),
  event_type           TEXT NOT NULL,
  created_at           INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata             TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_sub
  ON subscription_events(user_subscription_id);
