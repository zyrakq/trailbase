import { describe, it, expect, vi } from 'vitest';

// The themeService singleton instantiates at module load and calls
// localStorage.getItem / window.matchMedia during import. Under Node.js
// (bun run test) the happy-dom environment may not have populated these
// globals yet at import-evaluation time, so set up minimal stubs first.
vi.hoisted(() => {
  if (!globalThis.localStorage) {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage;
  }
  if (!globalThis.matchMedia) {
    globalThis.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof globalThis.matchMedia;
  }
});

import { themeService } from './theme.service';

describe('themeService singleton', () => {
  it('uses "theme" as the localStorage key', () => {
    expect(themeService.getConfig().storage.key).toBe('theme');
  });
});
