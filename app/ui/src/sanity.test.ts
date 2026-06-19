import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('performs basic arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('has a document body in the happy-dom environment', () => {
    expect(document.body).toBeTruthy();
  });
});
