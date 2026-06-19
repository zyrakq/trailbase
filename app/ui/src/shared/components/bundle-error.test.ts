import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './bundle-error';
import type { BundleError } from './bundle-error';

describe('bundle-error', () => {
  let element: BundleError;

  beforeEach(async () => {
    element = document.createElement('bundle-error') as BundleError;
    element.message = 'Failed to load resources';
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it('renders the title and message in the shadow DOM', () => {
    const shadow = element.shadowRoot;
    expect(shadow).toBeTruthy();

    const title = shadow?.querySelector('.status-title');
    const message = shadow?.querySelector('.status-message');
    const icon = shadow?.querySelector('.status-icon.error-icon');

    expect(title?.textContent?.trim()).toBe('Something went wrong');
    expect(message?.textContent?.trim()).toBe('Failed to load resources');
    expect(icon?.textContent?.trim()).toBe('✕');
  });

  it('uses the default retry label from msg()', () => {
    const button = element.shadowRoot?.querySelector('button');
    expect(button?.textContent?.trim()).toBe('Retry');
  });

  it('reflects an overridden retry label', async () => {
    element.retryLabel = 'Try again';
    await element.updateComplete;

    const button = element.shadowRoot?.querySelector('button');
    expect(button?.textContent?.trim()).toBe('Try again');
  });

  it('dispatches a bubbling, composed bundle-error-retry event on click', () => {
    const handler = vi.fn();
    document.addEventListener('bundle-error-retry', handler);

    const button = element.shadowRoot?.querySelector(
      'button',
    ) as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    button?.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as CustomEvent | undefined;
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event?.type).toBe('bundle-error-retry');
    expect(event?.bubbles).toBe(true);
    expect(event?.composed).toBe(true);
    expect(event?.detail).toBeNull();

    document.removeEventListener('bundle-error-retry', handler);
  });
});
