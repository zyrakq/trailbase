import type {
  CatalogResponse,
  Subscription,
  SubscriptionEvent,
  SubscriptionEventWithSub,
  SubscriptionInput,
  SubscriptionPeriod,
  SubscriptionPricing,
  UserSubscription,
} from '../types/subscription.types.ts';

function secToMs(sec: unknown): number {
  return (sec as number) * 1000;
}

function mapPricing(raw: Record<string, unknown>): SubscriptionPricing {
  return {
    id: raw['id'] as string,
    subscription_id: raw['subscription_id'] as string,
    period: raw['period'] as SubscriptionPricing['period'],
    price: raw['price'] as number,
    currency: raw['currency'] as string,
    is_archived: !!raw['is_archived'],
  };
}

function mapSubscription(
  raw: Record<string, unknown>,
  pricing: SubscriptionPricing[]
): Subscription {
  return {
    id: raw['id'] as string,
    name: raw['name'] as string,
    description: raw['description'] as string,
    logo_url: raw['logo_url'] as string,
    resource_url: raw['resource_url'] as string,
    status: raw['status'] as Subscription['status'],
    created_at: secToMs(raw['created_at']),
    updated_at: secToMs(raw['updated_at']),
    what_included: raw['what_included'] as string | undefined,
    terms: raw['terms'] as string | undefined,
    pricing,
  };
}

function mapUserSubscription(raw: Record<string, unknown>): UserSubscription {
  return {
    id: raw['id'] as string,
    user_id: raw['user_id'] as string,
    subscription_id: raw['subscription_id'] as string,
    status: raw['status'] as UserSubscription['status'],
    period: ((raw['period'] as string) || undefined) as SubscriptionPeriod | undefined,
    subscribed_at: secToMs(raw['subscribed_at']),
    expires_at: raw['expires_at'] != null ? secToMs(raw['expires_at']) : undefined,
    cancelled_at: raw['cancelled_at'] != null ? secToMs(raw['cancelled_at']) : undefined,
  };
}

function mapEvent(raw: Record<string, unknown>): SubscriptionEvent {
  let metadata: Record<string, unknown> | undefined;
  if (raw['metadata']) {
    try {
      metadata = JSON.parse(raw['metadata'] as string) as Record<string, unknown>;
    } catch {
      metadata = undefined;
    }
  }
  return {
    id: raw['id'] as string,
    user_subscription_id: raw['user_subscription_id'] as string,
    event_type: raw['event_type'] as SubscriptionEvent['event_type'],
    created_at: secToMs(raw['created_at']),
    metadata,
  };
}

interface RawCatalogResponse {
  subscriptions: Record<string, unknown>[];
  available_periods: string[];
}

async function fetchCatalog(endpoint: string): Promise<CatalogResponse> {
  const response = await fetch(endpoint, { credentials: 'include' });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Catalog fetch failed: ${response.status} ${text}`);
  }
  const raw = (await response.json()) as RawCatalogResponse;
  const pricingBySubId = new Map<string, SubscriptionPricing[]>();
  for (const s of raw.subscriptions) {
    const rawPricing = (s['pricing'] as Record<string, unknown>[] | undefined) ?? [];
    const id = s['id'] as string;
    pricingBySubId.set(id, rawPricing.map(mapPricing));
  }
  const subscriptions = raw.subscriptions.map(s =>
    mapSubscription(s, pricingBySubId.get(s['id'] as string) ?? [])
  );
  const availablePeriods = raw.available_periods.filter(
    (p): p is SubscriptionPeriod =>
      p === 'monthly' || p === 'quarterly' || p === 'yearly' || p === 'onetime'
  );
  return { subscriptions, availablePeriods };
}

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint, { credentials: 'include' });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return (await response.json()) as T;
}

class SubscriptionsService {
  private static instance: SubscriptionsService;

  private constructor() {}

  static getInstance(): SubscriptionsService {
    if (!SubscriptionsService.instance) {
      SubscriptionsService.instance = new SubscriptionsService();
    }
    return SubscriptionsService.instance;
  }

  async getCatalog(): Promise<CatalogResponse> {
    return fetchCatalog('/api/subscriptions/catalog');
  }

  async getMine(): Promise<CatalogResponse> {
    return fetchCatalog('/api/subscriptions/mine');
  }

  async getAllAdmin(): Promise<Subscription[]> {
    const raw = await fetchJson<Record<string, unknown>[]>('/api/admin/subscriptions');
    return raw.map(s => {
      const pricing = ((s['pricing'] as Record<string, unknown>[] | undefined) ?? []).map(mapPricing);
      return mapSubscription(s, pricing);
    });
  }

  async getById(id: string): Promise<Subscription | undefined> {
    try {
      const raw = await fetchJson<Record<string, unknown>>(`/api/subscriptions/${encodeURIComponent(id)}`);
      const pricing = ((raw['pricing'] as Record<string, unknown>[] | undefined) ?? []).map(mapPricing);
      return mapSubscription(raw, pricing);
    } catch {
      return undefined;
    }
  }

  async getUserSubscriptions(): Promise<UserSubscription[]> {
    const raw = await fetchJson<Record<string, unknown>[]>('/api/subscriptions/user-subs');
    return raw.map(mapUserSubscription);
  }

  async getEventHistory(): Promise<SubscriptionEventWithSub[]> {
    const raw = await fetchJson<Record<string, unknown>[]>('/api/subscriptions/events');
    return raw.map(r => ({
      ...mapEvent(r),
      subscriptionName: r['subscription_name'] as string,
    }));
  }

  async subscribe(subscriptionId: string, period: SubscriptionPeriod): Promise<UserSubscription> {
    const response = await fetch('/api/subscriptions/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_id: subscriptionId, period }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Subscribe failed: ${response.status} ${text}`);
    }
    return (await response.json()) as UserSubscription;
  }

  async cancel(userSubscriptionId: string): Promise<UserSubscription> {
    const response = await fetch(`/api/subscriptions/cancel/${userSubscriptionId}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Cancel failed: ${response.status} ${text}`);
    }
    return (await response.json()) as UserSubscription;
  }

  async create(data: SubscriptionInput): Promise<Subscription> {
    const response = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Create failed: ${response.status} ${text}`);
    }
    const { id } = (await response.json()) as { id: string };
    const created = await this.getById(id);
    if (!created) throw new Error(`Subscription not found after create: ${id}`);
    return created;
  }

  async update(id: string, data: Partial<SubscriptionInput>): Promise<Subscription> {
    const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Update failed: ${response.status} ${text}`);
    }
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Subscription not found after update: ${id}`);
    return updated;
  }

  async archive(id: string): Promise<Subscription> {
    const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(id)}/archive`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Archive failed: ${response.status} ${text}`);
    }
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Subscription not found: ${id}`);
    return updated;
  }

  async restore(id: string): Promise<Subscription> {
    const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(id)}/restore`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Restore failed: ${response.status} ${text}`);
    }
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Subscription not found: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const response = await fetch(`/api/admin/subscriptions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Delete failed: ${response.status} ${text}`);
    }
  }

  async getSubscriberCount(subscriptionId: string): Promise<number> {
    const result = await fetchJson<{ count: number }>(
      `/api/subscriptions/${encodeURIComponent(subscriptionId)}/subscribers`
    );
    return result.count;
  }

  async getPricingSubscriberCount(period: SubscriptionPeriod, subscriptionId: string): Promise<number> {
    const result = await fetchJson<{ count: number }>(
      `/api/subscriptions/${encodeURIComponent(subscriptionId)}/subscribers?period=${period}`
    );
    return result.count;
  }
}

export const subscriptionsService = SubscriptionsService.getInstance();
export { SubscriptionsService };