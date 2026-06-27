-- Recreate subscription tables as STRICT (required by TrailBase record_apis).
-- These tables were just created empty in V200-V203.

PRAGMA foreign_keys = OFF;

DROP INDEX IF EXISTS idx_subscription_events_user_sub;
DROP INDEX IF EXISTS idx_user_subscriptions_status;
DROP INDEX IF EXISTS idx_user_subscriptions_sub_id;
DROP INDEX IF EXISTS idx_user_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscription_pricing_unique;
DROP INDEX IF EXISTS idx_subscription_pricing_sub_id;
DROP INDEX IF EXISTS idx_subscriptions_status;

DROP TABLE IF EXISTS subscription_events;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_pricing;
DROP TABLE IF EXISTS subscriptions;

CREATE TABLE subscriptions (
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

CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TABLE subscription_pricing (
  id              TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  price           INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'RUB',
  is_archived     INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX idx_subscription_pricing_sub_id
  ON subscription_pricing(subscription_id);

CREATE UNIQUE INDEX idx_subscription_pricing_unique
  ON subscription_pricing(subscription_id, period) WHERE is_archived = 0;

CREATE TABLE user_subscriptions (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  period          TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active',
  subscribed_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at      INTEGER,
  cancelled_at    INTEGER
) STRICT;

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_sub_id  ON user_subscriptions(subscription_id);
CREATE INDEX idx_user_subscriptions_status  ON user_subscriptions(status);

CREATE TABLE subscription_events (
  id                   TEXT PRIMARY KEY,
  user_subscription_id TEXT NOT NULL REFERENCES user_subscriptions(id),
  event_type           TEXT NOT NULL,
  created_at           INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata             TEXT
) STRICT;

CREATE INDEX idx_subscription_events_user_sub ON subscription_events(user_subscription_id);

PRAGMA foreign_keys = ON;
