import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  if (typeof localStorage !== 'undefined') return;
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key) { return store.has(key) ? (store.get(key) as string) : null; },
    k(index) { return Array.from(store.keys())[index] ?? null; },
    removeItem(key) { store.delete(key); },
    setItem(key, value) { store.set(key, value); },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill, writable: true, configurable: true,
  });
});

// createImageBitmap is not implemented in happy-dom; stub it with a tiny
// canvas-backed bitmap stand-in so the cropper's load path runs.
vi.hoisted(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  Object.defineProperty(globalThis, 'createImageBitmap', {
    value: vi.fn().mockResolvedValue(canvas),
    writable: true,
    configurable: true,
  });
});

import './image-cropper';
import type { ImageCropper } from './image-cropper';

describe('image-cropper', () => {
  let element: ImageCropper;

  beforeEach(() => {
    element = document.createElement('image-cropper') as ImageCropper;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element?.remove();
  });

  it('renders the placeholder when no file is set', async () => {
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.placeholder')).not.toBeNull();
  });

  it('emits cropped with a Blob after a file is loaded', async () => {
    let received: Blob | null = null;
    element.addEventListener('cropped', (e: Event) => {
      received = (e as CustomEvent<{ blob: Blob }>).detail.blob;
    });
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
      type: 'image/png',
    });
    element.file = file;
    await element.updateComplete;
    // toBlob is async via callback; flush microtasks.
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(received).toBeInstanceOf(Blob);
  });

  it('emits error when the source exceeds the size cap', async () => {
    let received = '';
    element.addEventListener('error', (e: Event) => {
      received = (e as CustomEvent<{ message: string }>).detail.message;
    });
    const oversize = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', {
      type: 'image/png',
    });
    element.file = oversize;
    await element.updateComplete;
    expect(received.length).toBeGreaterThan(0);
  });
});
