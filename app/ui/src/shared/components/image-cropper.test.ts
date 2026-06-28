import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  if (typeof localStorage !== 'undefined') return;
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key) { return store.has(key) ? (store.get(key) as string) : null; },
    key(index) { return Array.from(store.keys())[index] ?? null; },
    removeItem(key) { store.delete(key); },
    setItem(key, value) { store.set(key, value); },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: polyfill, writable: true, configurable: true,
  });
});

vi.hoisted(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  (canvas as unknown as Record<string, unknown>).close = vi.fn();
  Object.defineProperty(globalThis, 'createImageBitmap', {
    value: vi.fn().mockResolvedValue(canvas),
    writable: true,
    configurable: true,
  });
});

vi.hoisted(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value(callback: BlobCallback) {
      callback(new Blob([new Uint8Array([1])], { type: 'image/png' }));
    },
    writable: true,
    configurable: true,
  });
});

import './image-cropper';
import type { ImageCropper } from './image-cropper';

describe('image-cropper', () => {
  let element: ImageCropper;

  beforeEach(async () => {
    element = document.createElement('image-cropper') as ImageCropper;
    document.body.appendChild(element);
    await new Promise(r => setTimeout(r, 0));
    await element.updateComplete;
  });

  afterEach(() => {
    element?.remove();
  });

  it('renders the placeholder when no file is set', async () => {
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.placeholder')).toBeNull();
    expect(element.shadowRoot!.querySelector('.drop-zone')).not.toBeNull();
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

  describe('drop zone', () => {
    it('renders .drop-zone in empty state', async () => {
      const zone = element.shadowRoot!.querySelector('.drop-zone');
      expect(zone).not.toBeNull();
    });

    it('renders upload heading and hint text in drop zone', async () => {
      const heading = element.shadowRoot!.querySelector('.drop-zone-heading');
      const hint = element.shadowRoot!.querySelector('.drop-zone-hint');
      expect(heading).not.toBeNull();
      expect(hint).not.toBeNull();
    });

    it('renders a Choose file button in drop zone', async () => {
      const btn = element.shadowRoot!.querySelector('.btn-choose');
      expect(btn).not.toBeNull();
    });

    it('adds drag-over class on dragover event', async () => {
      element.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
      await element.updateComplete;
      const zone = element.shadowRoot!.querySelector('.drop-zone');
      expect(zone?.classList.contains('drag-over')).toBe(true);
    });

    it('removes drag-over class on dragleave event', async () => {
      element.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
      await element.updateComplete;
      element.dispatchEvent(new DragEvent('dragleave', { bubbles: true }));
      await element.updateComplete;
      const zone = element.shadowRoot!.querySelector('.drop-zone');
      expect(zone?.classList.contains('drag-over')).toBe(false);
    });

    it('hides drop zone and shows canvas after file is loaded', async () => {
      const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
        type: 'image/png',
      });
      element.file = file;
      await element.updateComplete;
      await new Promise(r => setTimeout(r, 10));
      await element.updateComplete;
      expect(element.shadowRoot!.querySelector('.drop-zone')).toBeNull();
      expect(element.shadowRoot!.querySelector('.canvas-wrap')).not.toBeNull();
    });

    it('shows drop zone again after Change image button is clicked', async () => {
      const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
        type: 'image/png',
      });
      element.file = file;
      await element.updateComplete;
      await new Promise(r => setTimeout(r, 10));
      await element.updateComplete;

      const changeBtn = element.shadowRoot!.querySelector<HTMLButtonElement>('.btn-change');
      expect(changeBtn).not.toBeNull();
      changeBtn!.click();
      await element.updateComplete;

      expect(element.shadowRoot!.querySelector('.drop-zone')).not.toBeNull();
      expect(element.shadowRoot!.querySelector('.canvas-wrap')).toBeNull();
    });

    it('shows uploading overlay when uploading property is true', async () => {
      const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
        type: 'image/png',
      });
      element.file = file;
      await element.updateComplete;
      await new Promise(r => setTimeout(r, 10));
      await element.updateComplete;

      element.uploading = true;
      await element.updateComplete;
      expect(element.shadowRoot!.querySelector('.uploading-overlay')).not.toBeNull();

      element.uploading = false;
      await element.updateComplete;
      expect(element.shadowRoot!.querySelector('.uploading-overlay')).toBeNull();
    });
  });
});
