export type SubscriptionPeriod = 'monthly' | 'quarterly' | 'yearly' | 'onetime';

export type SubscriptionStatus = 'active' | 'archived';
export type UserSubscriptionStatus = 'active' | 'cancelled' | 'expired';
export type SubscriptionEventType = 'subscribed' | 'cancelled' | 'expired' | 'renewed';

export interface SubscriptionPricing {
  id: string;
  subscription_id: string;
  period: SubscriptionPeriod;
  price: number;
  currency: string;
  is_archived: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  resource_url: string;
  status: SubscriptionStatus;
  created_at: number;
  updated_at: number;
  what_included?: string;
  terms?: string;
  pricing: SubscriptionPricing[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  status: UserSubscriptionStatus;
  period?: SubscriptionPeriod;
  subscribed_at: number;
  expires_at?: number;
  cancelled_at?: number;
}

export interface SubscriptionEvent {
  id: string;
  user_subscription_id: string;
  event_type: SubscriptionEventType;
  created_at: number;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionWithUserSub extends Subscription {
  userSubscription?: UserSubscription;
}

export interface SubscriptionInput {
  name: string;
  description: string;
  logo_url: string;
  resource_url: string;
  what_included?: string;
  terms?: string;
  pricing: Array<{ period: SubscriptionPeriod; price: number; currency: string }>;
}

export interface SubscriptionEventWithSub extends SubscriptionEvent {
  subscriptionName: string;
}

export interface CatalogResponse {
  subscriptions: Subscription[];
  availablePeriods: SubscriptionPeriod[];
}
