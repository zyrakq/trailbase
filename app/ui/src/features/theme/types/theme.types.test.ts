import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, THEME_STORAGE_KEY } from './theme.types';

describe('theme.types', () => {
  it('DEFAULT_CONFIG.storage.key is "theme"', () => {
    expect(DEFAULT_CONFIG.storage.key).toBe('theme');
  });

  it('THEME_STORAGE_KEY is "theme"', () => {
    expect(THEME_STORAGE_KEY).toBe('theme');
  });
});
