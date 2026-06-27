import { trailbaseService } from '@/features/auth/index.ts';
import type {
  Subscription,
  SubscriptionEvent,
  SubscriptionEventWithSub,
  SubscriptionInput,
  SubscriptionPeriod,
  SubscriptionPricing,
  UserSubscription,
} from '../types/subscription.types.ts';

// DB stores timestamps as unixepoch (seconds); TS types use milliseconds.
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
    is_archived: !!(raw['is_archived'] as number),
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

async function joinPricingToSubscriptions(
  subs: Record<string, unknown>[]
): Promise<Subscription[]> {
  if (subs.length === 0) return [];
  const client = await trailbaseService.initClient();
  const pricingResult = await client
    .records<Record<string, unknown>>('subscription_pricing')
    .list({ filters: [{ column: 'is_archived', op: 'equal', value: '0' }], pagination: { limit: 1024 } });

  const pricingBySubId = new Map<string, SubscriptionPricing[]>();
  for (const p of pricingResult.records) {
    const mapped = mapPricing(p);
    const existing = pricingBySubId.get(mapped.subscription_id) ?? [];
    existing.push(mapped);
    pricingBySubId.set(mapped.subscription_id, existing);
  }

  return subs.map(raw =>
    mapSubscription(raw, pricingBySubId.get(raw['id'] as string) ?? [])
  );
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

  async getAll(): Promise<Subscription[]> {
    const client = await trailbaseService.initClient();
    const result = await client
      .records<Record<string, unknown>>('subscriptions')
      .list({ filters: [{ column: 'status', op: 'equal', value: 'active' }], pagination: { limit: 1024 } });
    return joinPricingToSubscriptions(result.records);
  }

  async getAllAdmin(): Promise<Subscription[]> {
    const client = await trailbaseService.initClient();
    const result = await client
      .records<Record<string, unknown>>('subscriptions')
      .list({ pagination: { limit: 1024 } });
    return joinPricingToSubscriptions(result.records);
  }

  async getById(id: string): Promise<Subscription | undefined> {
    const client = await trailbaseService.initClient();
    const [raw, pricingResult] = await Promise.all([
      client.records<Record<string, unknown>>('subscriptions').read(id),
      client.records<Record<string, unknown>>('subscription_pricing').list({
        filters: [{ column: 'subscription_id', op: 'equal', value: id }],
        pagination: { limit: 64 },
      }),
    ]);
    const pricing = pricingResult.records.map(mapPricing);
    return mapSubscription(raw, pricing);
  }

  async getUserSubscriptions(): Promise<UserSubscription[]> {
    const client = await trailbaseService.initClient();
    const result = await client
      .records<Record<string, unknown>>('user_subscriptions')
      .list({
        filters: [{ column: 'status', op: 'equal', value: 'active' }],
        pagination: { limit: 256 },
      });
    const now = Date.now();
    return result.records
      .map(mapUserSubscription)
      .filter(u => u.expires_at === undefined || u.expires_at > now);
  }

  async getSubscribedSubscriptions(userSubs: UserSubscription[]): Promise<Subscription[]> {
    const ids = [...new Set(userSubs.map(u => u.subscription_id))];
    if (ids.length === 0) return [];
    const client = await trailbaseService.initClient();
    const result = await client
      .records<Record<string, unknown>>('subscriptions')
      .list({ pagination: { limit: 1024 } });
    const idSet = new Set(ids);
    const subscribed = result.records.filter(s => idSet.has(s['id'] as string));
    return joinPricingToSubscriptions(subscribed);
  }

  async getEventHistory(): Promise<SubscriptionEventWithSub[]> {
    const client = await trailbaseService.initClient();

    const [userSubsResult, eventsResult] = await Promise.all([
      client.records<Record<string, unknown>>('user_subscriptions').list({ pagination: { limit: 256 } }),
      client.records<Record<string, unknown>>('subscription_events').list({
        order: ['-created_at'],
        pagination: { limit: 256 },
      }),
    ]);

    const subIds = [...new Set(
      userSubsResult.records.map(us => us['subscription_id'] as string)
    )];

    let subsResult: Record<string, unknown>[] = [];
    if (subIds.length > 0) {
      const r = await client
        .records<Record<string, unknown>>('subscriptions')
        .list({ pagination: { limit: 256 } });
      subsResult = r.records;
    }

    const subNameById = new Map(subsResult.map(s => [s['id'] as string, s['name'] as string]));
    const userSubById = new Map(
      userSubsResult.records.map(us => [us['id'] as string, us])
    );

    return eventsResult.records.map(raw => {
      const event = mapEvent(raw);
      const userSub = userSubById.get(event.user_subscription_id);
      const subName = userSub
        ? (subNameById.get(userSub['subscription_id'] as string) ?? 'Unknown')
        : 'Unknown';
      return { ...event, subscriptionName: subName };
    });
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
    const client = await trailbaseService.initClient();
    const id = crypto.randomUUID();
    await client.records('subscriptions').create({
      id,
      name: data.name,
      description: data.description,
      logo_url: data.logo_url,
      resource_url: data.resource_url,
      what_included: data.what_included ?? '',
      terms: data.terms ?? '',
      status: 'active',
    });
    const pricingRecords = await Promise.all(
      data.pricing.map(p =>
        client.records<Record<string, unknown>>('subscription_pricing').create({
          id: crypto.randomUUID(),
          subscription_id: id,
          period: p.period,
          price: p.price,
          currency: p.currency,
          is_archived: 0,
        } as Record<string, unknown>)
      )
    );
    const pricing: SubscriptionPricing[] = data.pricing.map((p, i) => ({
      id: pricingRecords[i] as string,
      subscription_id: id,
      period: p.period,
      price: p.price,
      currency: p.currency,
      is_archived: false,
    }));
    const now = Date.now();
    return {
      id,
      name: data.name,
      description: data.description,
      logo_url: data.logo_url,
      resource_url: data.resource_url,
      status: 'active',
      created_at: now,
      updated_at: now,
      what_included: data.what_included,
      terms: data.terms,
      pricing,
    };
  }

  async update(id: string, data: Partial<SubscriptionInput>): Promise<Subscription> {
    const client = await trailbaseService.initClient();
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.logo_url !== undefined) updatePayload['logo_url'] = data.logo_url;
    if (data.resource_url !== undefined) updatePayload['resource_url'] = data.resource_url;
    if (data.what_included !== undefined) updatePayload['what_included'] = data.what_included;
    if (data.terms !== undefined) updatePayload['terms'] = data.terms;

    await client.records('subscriptions').update(id, updatePayload);

    if (data.pricing !== undefined) {
      const existingResult = await client
        .records<Record<string, unknown>>('subscription_pricing')
        .list({ filters: [{ column: 'subscription_id', op: 'equal', value: id }], pagination: { limit: 64 } });

      await Promise.all(
        existingResult.records.map(p =>
          client.records('subscription_pricing').update(p['id'] as string, { is_archived: 1 })
        )
      );

      await Promise.all(
        data.pricing.map(p =>
          client.records('subscription_pricing').create({
            id: crypto.randomUUID(),
            subscription_id: id,
            period: p.period,
            price: p.price,
            currency: p.currency,
            is_archived: 0,
          })
        )
      );
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Subscription not found after update: ${id}`);
    return updated;
  }

  async archive(id: string): Promise<Subscription> {
    const client = await trailbaseService.initClient();
    await client.records('subscriptions').update(id, { status: 'archived' });
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Subscription not found: ${id}`);
    return updated;
  }

  async restore(id: string): Promise<Subscription> {
    const client = await trailbaseService.initClient();
    await client.records('subscriptions').update(id, { status: 'active' });
    const updated = await this.getById(id);
    if (!updated) throw new Error(`Subscription not found: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const client = await trailbaseService.initClient();
    await client.records('subscriptions').delete(id);
  }

  async getSubscriberCount(subscriptionId: string): Promise<number> {
    const client = await trailbaseService.initClient();
    // count=true requires TrailBase to return total_count; use a large limit as fallback.
    const result = await client
      .records<Record<string, unknown>>('user_subscriptions')
      .list({
        filters: [
          { column: 'subscription_id', op: 'equal', value: subscriptionId },
          { column: 'status', op: 'equal', value: 'active' },
        ],
        count: true,
        pagination: { limit: 1 },
      });
    return result.total_count ?? result.records.length;
  }

  async getPricingSubscriberCount(period: SubscriptionPeriod, subscriptionId: string): Promise<number> {
    const client = await trailbaseService.initClient();
    const result = await client
      .records<Record<string, unknown>>('user_subscriptions')
      .list({
        filters: [
          { column: 'subscription_id', op: 'equal', value: subscriptionId },
          { column: 'status', op: 'equal', value: 'active' },
          { column: 'period', op: 'equal', value: period },
        ],
        count: true,
        pagination: { limit: 1 },
      });
    return result.total_count ?? result.records.length;
  }
}

export const subscriptionsService = SubscriptionsService.getInstance();
export { SubscriptionsService };

