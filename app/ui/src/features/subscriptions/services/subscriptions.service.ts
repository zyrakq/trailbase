import type {
  Subscription,
  SubscriptionEvent,
  SubscriptionEventWithSub,
  SubscriptionInput,
  SubscriptionPeriod,
  UserSubscription,
} from '../types/subscription.types.ts';

const USE_MOCK = true;
const NOT_IMPLEMENTED = 'Not implemented — connect to backend in Phase 8';
const DAY_MS = 86400000;

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'Gitea',
    description: 'Self-hosted Git service with pull requests, issues, and CI.',
    logo_url: 'https://about.gitea.com/images/gitea.svg',
    resource_url: 'https://git.example.com',
    status: 'active',
    created_at: Date.now() - DAY_MS * 120,
    updated_at: Date.now() - DAY_MS * 10,
    what_included: 'Access to a personal Gitea instance with unlimited private repositories, CI/CD via Gitea Actions, issue tracker, and wiki.',
    terms: 'Service includes regular updates and maintenance. Backups performed daily. 99.5% uptime SLA.',
    pricing: [
      { id: 'p1-mo', subscription_id: '1', period: 'monthly', price: 500, currency: 'RUB', is_archived: false },
      { id: 'p1-qu', subscription_id: '1', period: 'quarterly', price: 1400, currency: 'RUB', is_archived: false },
      { id: 'p1-yr', subscription_id: '1', period: 'yearly', price: 5000, currency: 'RUB', is_archived: false },
    ],
  },
  {
    id: '2',
    name: 'Nextcloud',
    description: 'File hosting and collaboration platform.',
    logo_url: 'https://nextcloud.com/wp-content/themes/next/assets/img/common/nextcloud-logo.svg',
    resource_url: '',
    status: 'active',
    created_at: Date.now() - DAY_MS * 90,
    updated_at: Date.now() - DAY_MS * 5,
    what_included: '10 GB personal cloud storage, calendar, contacts sync, and document editing via Collabora Online.',
    terms: 'Data stored on private infrastructure. No third-party access. Backups weekly.',
    pricing: [
      { id: 'p2-mo', subscription_id: '2', period: 'monthly', price: 300, currency: 'RUB', is_archived: false },
      { id: 'p2-qu', subscription_id: '2', period: 'quarterly', price: 850, currency: 'RUB', is_archived: false },
      { id: 'p2-yr', subscription_id: '2', period: 'yearly', price: 3000, currency: 'RUB', is_archived: false },
    ],
  },
  {
    id: '3',
    name: 'Vaultwarden',
    description: 'Self-hosted password manager compatible with Bitwarden.',
    logo_url: '',
    resource_url: 'https://vault.example.com',
    status: 'active',
    created_at: Date.now() - DAY_MS * 60,
    updated_at: Date.now() - DAY_MS * 2,
    what_included: 'Unlimited password vault entries, secure notes, TOTP generator, and browser extension support.',
    terms: 'Vault is end-to-end encrypted. Master password never stored. Emergency access supported.',
    pricing: [
      { id: 'p3-yr', subscription_id: '3', period: 'yearly', price: 2000, currency: 'RUB', is_archived: false },
      { id: 'p3-ot', subscription_id: '3', period: 'onetime', price: 5000, currency: 'RUB', is_archived: false },
    ],
  },
  {
    id: '4',
    name: 'Grafana (Legacy)',
    description: 'Old monitoring stack, superseded.',
    logo_url: 'https://grafana.com/static/img/menu/grafana2.svg',
    resource_url: '',
    status: 'archived',
    created_at: Date.now() - DAY_MS * 300,
    updated_at: Date.now() - DAY_MS * 40,
    what_included: 'Monitoring dashboards (legacy, discontinued).',
    terms: 'Archived service, no longer maintained.',
    pricing: [
      { id: 'p4-mo', subscription_id: '4', period: 'monthly', price: 200, currency: 'RUB', is_archived: false },
    ],
  },
];

const MOCK_USER_SUBSCRIPTIONS: UserSubscription[] = [
  {
    id: 'us1',
    user_id: 'me',
    subscription_id: '1',
    status: 'active',
    period: 'monthly',
    subscribed_at: Date.now() - DAY_MS * 30,
  },
];

const MOCK_EVENTS = [
  { id: 'e1', user_subscription_id: 'us1', event_type: 'subscribed' as const, created_at: Date.now() - DAY_MS * 30 },
  { id: 'e2', user_subscription_id: 'us1', event_type: 'renewed' as const, created_at: Date.now() - DAY_MS * 5 },
  { id: 'e3', user_subscription_id: 'us-old', event_type: 'cancelled' as const, created_at: Date.now() - DAY_MS * 15 },
  { id: 'e4', user_subscription_id: 'us-old2', event_type: 'expired' as const, created_at: Date.now() - DAY_MS * 45 },
  { id: 'e5', user_subscription_id: 'us-old3', event_type: 'cancelled' as const, created_at: Date.now() - DAY_MS * 60 },
];

class SubscriptionsService {
  private static instance: SubscriptionsService;
  private subscriptions: Subscription[];
  private userSubscriptions: UserSubscription[];
  private events: SubscriptionEvent[];

  private constructor() {
    this.subscriptions = structuredClone(MOCK_SUBSCRIPTIONS);
    this.userSubscriptions = structuredClone(MOCK_USER_SUBSCRIPTIONS);
    this.events = structuredClone(MOCK_EVENTS);
  }

  static getInstance(): SubscriptionsService {
    if (!SubscriptionsService.instance) {
      SubscriptionsService.instance = new SubscriptionsService();
    }
    return SubscriptionsService.instance;
  }

  async getAll(): Promise<Subscription[]> {
    if (USE_MOCK) return this.subscriptions.filter(s => s.status === 'active');
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async getAllAdmin(): Promise<Subscription[]> {
    if (USE_MOCK) return [...this.subscriptions];
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async getById(id: string): Promise<Subscription | undefined> {
    if (USE_MOCK) return this.subscriptions.find(s => s.id === id);
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async getUserSubscriptions(): Promise<UserSubscription[]> {
    if (USE_MOCK) return this.userSubscriptions.filter(u => u.status === 'active');
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async getEventHistory(): Promise<SubscriptionEventWithSub[]> {
    if (USE_MOCK) {
      const subscriptionById = new Map(this.subscriptions.map(s => [s.id, s]));
      return this.events
        .map<SubscriptionEventWithSub>(event => {
          const userSub = this.userSubscriptions.find(u => u.id === event.user_subscription_id);
          const subscription = userSub ? subscriptionById.get(userSub.subscription_id) : undefined;
          return { ...event, subscriptionName: subscription?.name ?? 'Unknown' };
        })
        .sort((a, b) => b.created_at - a.created_at);
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async subscribe(subscriptionId: string, period: SubscriptionPeriod): Promise<UserSubscription> {
    if (USE_MOCK) {
      const now = Date.now();
      const newSub: UserSubscription = {
        id: `us${now}`,
        user_id: 'me',
        subscription_id: subscriptionId,
        status: 'active',
        period,
        subscribed_at: now,
      };
      this.userSubscriptions.push(newSub);
      this.events.push({ id: `e${now}`, user_subscription_id: newSub.id, event_type: 'subscribed', created_at: now });
      return newSub;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async cancel(userSubscriptionId: string): Promise<UserSubscription> {
    if (USE_MOCK) {
      const target = this.userSubscriptions.find(u => u.id === userSubscriptionId);
      if (!target) return Promise.reject(new Error(`User subscription not found: ${userSubscriptionId}`));
      const now = Date.now();
      target.status = 'cancelled';
      target.cancelled_at = now;
      this.events.push({ id: `e${now}`, user_subscription_id: target.id, event_type: 'cancelled', created_at: now });
      return target;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async create(data: SubscriptionInput): Promise<Subscription> {
    if (USE_MOCK) {
      const now = Date.now();
      const id = `sub${now}`;
      const created: Subscription = {
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
        pricing: data.pricing.map((p, i) => ({ ...p, id: `p-new-${now}-${i}`, subscription_id: id, is_archived: false })),
      };
      this.subscriptions.push(created);
      return created;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async update(id: string, data: Partial<SubscriptionInput>): Promise<Subscription> {
    if (USE_MOCK) {
      const target = this.subscriptions.find(s => s.id === id);
      if (!target) return Promise.reject(new Error(`Subscription not found: ${id}`));
      if (data.name !== undefined) target.name = data.name;
      if (data.description !== undefined) target.description = data.description;
      if (data.logo_url !== undefined) target.logo_url = data.logo_url;
      if (data.resource_url !== undefined) target.resource_url = data.resource_url;
      if (data.what_included !== undefined) target.what_included = data.what_included;
      if (data.terms !== undefined) target.terms = data.terms;
      if (data.pricing !== undefined) {
        const now = Date.now();
        target.pricing = data.pricing.map((p, i) => {
          const existing = target.pricing.find(ep => ep.period === p.period);
          return existing
            ? { ...existing, price: p.price, currency: p.currency }
            : { ...p, id: `p-upd-${now}-${i}`, subscription_id: id, is_archived: false };
        });
      }
      target.updated_at = Date.now();
      return target;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async archive(id: string): Promise<Subscription> {
    if (USE_MOCK) {
      const target = this.subscriptions.find(s => s.id === id);
      if (!target) return Promise.reject(new Error(`Subscription not found: ${id}`));
      target.status = 'archived';
      target.updated_at = Date.now();
      return target;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async restore(id: string): Promise<Subscription> {
    if (USE_MOCK) {
      const target = this.subscriptions.find(s => s.id === id);
      if (!target) return Promise.reject(new Error(`Subscription not found: ${id}`));
      target.status = 'active';
      target.updated_at = Date.now();
      return target;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      const index = this.subscriptions.findIndex(s => s.id === id);
      if (index !== -1) this.subscriptions.splice(index, 1);
      return;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async getSubscriberCount(subscriptionId: string): Promise<number> {
    if (USE_MOCK) {
      return this.userSubscriptions.filter(u => u.subscription_id === subscriptionId && u.status === 'active').length;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }

  async getPricingSubscriberCount(period: SubscriptionPeriod, subscriptionId: string): Promise<number> {
    if (USE_MOCK) {
      return this.userSubscriptions.filter(
        u => u.subscription_id === subscriptionId && u.status === 'active' && u.period === period
      ).length;
    }
    return Promise.reject(new Error(NOT_IMPLEMENTED));
  }
}

export const subscriptionsService = SubscriptionsService.getInstance();
export { SubscriptionsService };
