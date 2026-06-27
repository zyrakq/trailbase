CREATE TABLE IF NOT EXISTS user_subscriptions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  period          TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active',
  subscribed_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at      INTEGER,
  cancelled_at    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id
  ON user_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_sub_id
  ON user_subscriptions(subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status
  ON user_subscriptions(status);
