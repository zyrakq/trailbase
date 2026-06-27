CREATE TABLE IF NOT EXISTS subscription_pricing (
  id              BLOB PRIMARY KEY NOT NULL CHECK(is_uuid_v4(id)) DEFAULT (uuid_v4()),
  subscription_id BLOB NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  price           INTEGER NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'RUB',
  is_archived     INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX IF NOT EXISTS idx_subscription_pricing_sub_id
  ON subscription_pricing(subscription_id);

-- Only one active tier per period per subscription.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_pricing_unique
  ON subscription_pricing(subscription_id, period) WHERE is_archived = 0;
