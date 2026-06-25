import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SubscriptionsService } from './subscriptions.service.ts';
import { subscriptionsService } from './subscriptions.service.ts';

type LoadedService = {
  subscriptionsService: typeof subscriptionsService;
  SubscriptionsService: typeof SubscriptionsService;
};

async function loadService(): Promise<LoadedService> {
  const mod = await import('./subscriptions.service.ts');
  return {
    subscriptionsService: mod.subscriptionsService,
    SubscriptionsService: mod.SubscriptionsService,
  };
}

describe('SubscriptionsService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('singleton', () => {
    it('returns the same instance across calls', async () => {
      const { subscriptionsService, SubscriptionsService } = await loadService();
      expect(SubscriptionsService.getInstance()).toBe(subscriptionsService);
    });
  });

  describe('getAll', () => {
    it('returns only active subscriptions', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getAll();

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((s) => s.status === 'active')).toBe(true);
      expect(result.some((s) => s.name === 'Grafana (Legacy)')).toBe(false);
    });

    it('includes the active mock subscriptions', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getAll();
      const names = result.map((s) => s.name);

      expect(names).toContain('Gitea');
      expect(names).toContain('Nextcloud');
      expect(names).toContain('Vaultwarden');
    });
  });

  describe('getAllAdmin', () => {
    it('returns all subscriptions including archived', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getAllAdmin();
      const names = result.map((s) => s.name);

      expect(names).toContain('Gitea');
      expect(names).toContain('Grafana (Legacy)');
      expect(result.some((s) => s.status === 'archived')).toBe(true);
    });
  });

  describe('getUserSubscriptions', () => {
    it('returns only active user subscriptions', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getUserSubscriptions();

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((u) => u.status === 'active')).toBe(true);
    });
  });

  describe('getEventHistory', () => {
    it('returns events joined with subscription names', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getEventHistory();

      const subscribed = result.find((e) => e.id === 'e1');
      expect(subscribed?.subscriptionName).toBe('Gitea');

      const renewed = result.find((e) => e.id === 'e2');
      expect(renewed?.subscriptionName).toBe('Gitea');
    });

    it('maps events with no matching subscription to "Unknown"', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getEventHistory();

      const unknownEvents = result.filter((e) => e.subscriptionName === 'Unknown');
      expect(unknownEvents.length).toBeGreaterThan(0);
    });

    it('sorts events newest first', async () => {
      const { subscriptionsService } = await loadService();
      const result = await subscriptionsService.getEventHistory();

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1]!.created_at).toBeGreaterThanOrEqual(result[i]!.created_at);
      }
    });
  });

  describe('subscribe', () => {
    it('creates a new active user subscription and pushes a subscribed event', async () => {
      const { subscriptionsService } = await loadService();

      const beforeSubs = await subscriptionsService.getUserSubscriptions();
      const beforeEvents = await subscriptionsService.getEventHistory();

      const newSub = await subscriptionsService.subscribe('2', 'monthly');

      expect(newSub.subscription_id).toBe('2');
      expect(newSub.user_id).toBe('me');
      expect(newSub.status).toBe('active');
      expect(newSub.id).toBeTruthy();
      expect(typeof newSub.subscribed_at).toBe('number');

      const afterSubs = await subscriptionsService.getUserSubscriptions();
      expect(afterSubs.length).toBe(beforeSubs.length + 1);

      const afterEvents = await subscriptionsService.getEventHistory();
      expect(afterEvents.length).toBe(beforeEvents.length + 1);
      const newest = afterEvents[0]!;
      expect(newest.event_type).toBe('subscribed');
    });
  });

  describe('cancel', () => {
    it('cancels an existing user subscription and pushes a cancelled event', async () => {
      const { subscriptionsService } = await loadService();

      const beforeEvents = await subscriptionsService.getEventHistory();

      const cancelled = await subscriptionsService.cancel('us1');
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelled_at).toBeDefined();
      expect(typeof cancelled.cancelled_at).toBe('number');

      const afterEvents = await subscriptionsService.getEventHistory();
      expect(afterEvents.length).toBe(beforeEvents.length + 1);
      const newest = afterEvents[0]!;
      expect(newest.event_type).toBe('cancelled');
    });

    it('throws when the user subscription is not found', async () => {
      const { subscriptionsService } = await loadService();
      await expect(subscriptionsService.cancel('nonexistent')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('creates a new active subscription with generated id and timestamps', async () => {
      const { subscriptionsService } = await loadService();

      const before = await subscriptionsService.getAllAdmin();
      const created = await subscriptionsService.create({
        name: 'Test Service',
        description: 'Test description',
        logo_url: '',
        resource_url: '',
        pricing: [],
      });

      expect(created.name).toBe('Test Service');
      expect(created.status).toBe('active');
      expect(created.id).toBeTruthy();
      expect(typeof created.created_at).toBe('number');
      expect(typeof created.updated_at).toBe('number');

      const after = await subscriptionsService.getAllAdmin();
      expect(after.length).toBe(before.length + 1);
    });
  });

  describe('update', () => {
    it('merges fields and bumps updated_at', async () => {
      const { subscriptionsService } = await loadService();

      const all = await subscriptionsService.getAllAdmin();
      const target = all[0]!;
      const oldUpdatedAt = target.updated_at;

      await new Promise((resolve) => setTimeout(resolve, 2));

      const updated = await subscriptionsService.update(target.id, { name: 'New name' });
      expect(updated.name).toBe('New name');
      expect(updated.description).toBe(target.description);
      expect(updated.updated_at).toBeGreaterThanOrEqual(oldUpdatedAt);
    });

    it('throws when the subscription is not found', async () => {
      const { subscriptionsService } = await loadService();
      await expect(
        subscriptionsService.update('nonexistent', { name: 'X' })
      ).rejects.toThrow();
    });
  });

  describe('archive', () => {
    it('sets status to archived and bumps updated_at', async () => {
      const { subscriptionsService } = await loadService();

      const all = await subscriptionsService.getAllAdmin();
      const target = all.find((s) => s.status === 'active')!;
      const oldUpdatedAt = target.updated_at;

      await new Promise((resolve) => setTimeout(resolve, 2));

      const archived = await subscriptionsService.archive(target.id);
      expect(archived.status).toBe('archived');
      expect(archived.updated_at).toBeGreaterThanOrEqual(oldUpdatedAt);
    });

    it('throws when the subscription is not found', async () => {
      const { subscriptionsService } = await loadService();
      await expect(subscriptionsService.archive('nonexistent')).rejects.toThrow();
    });
  });

  describe('restore', () => {
    it('sets status to active and bumps updated_at', async () => {
      const { subscriptionsService } = await loadService();

      const all = await subscriptionsService.getAllAdmin();
      const target = all.find((s) => s.status === 'archived')!;
      const oldUpdatedAt = target.updated_at;

      await new Promise((resolve) => setTimeout(resolve, 2));

      const restored = await subscriptionsService.restore(target.id);
      expect(restored.status).toBe('active');
      expect(restored.updated_at).toBeGreaterThanOrEqual(oldUpdatedAt);
    });
  });

  describe('remove', () => {
    it('removes the subscription from the catalog', async () => {
      const { subscriptionsService } = await loadService();

      const before = await subscriptionsService.getAllAdmin();
      const target = before[0]!;

      await subscriptionsService.remove(target.id);

      const after = await subscriptionsService.getAllAdmin();
      expect(after.some((s) => s.id === target.id)).toBe(false);
      expect(after.length).toBe(before.length - 1);
    });
  });

  describe('getSubscriberCount', () => {
    it('counts only active subscribers for the subscription', async () => {
      const { subscriptionsService } = await loadService();

      const countOne = await subscriptionsService.getSubscriberCount('1');
      expect(countOne).toBe(1);

      const countTwo = await subscriptionsService.getSubscriberCount('2');
      expect(countTwo).toBe(0);
    });

    it('excludes cancelled user subscriptions from the count', async () => {
      const { subscriptionsService } = await loadService();

      const before = await subscriptionsService.getSubscriberCount('1');
      await subscriptionsService.cancel('us1');
      const after = await subscriptionsService.getSubscriberCount('1');

      expect(before).toBe(1);
      expect(after).toBe(0);
    });
  });
});
