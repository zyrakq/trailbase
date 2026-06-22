import { describe, it, expect } from 'vitest';
import { STORAGE_KEY } from './locale-metadata';

describe('locale-metadata', () => {
  it('STORAGE_KEY is "locale" (no argiago prefix)', () => {
    expect(STORAGE_KEY).toBe('locale');
  });
});
