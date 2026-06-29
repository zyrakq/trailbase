ALTER TABLE subscriptions
  ADD COLUMN activator TEXT NOT NULL DEFAULT 'sub-mock';

ALTER TABLE user_subscriptions
  ADD COLUMN activated_at INTEGER;

ALTER TABLE user_subscriptions
  ADD COLUMN activation_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_subscriptions
  ADD COLUMN next_activation_at INTEGER;
