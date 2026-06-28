import { css } from 'lit';

export const segmentedControlStyles = css`
  /* ── Pills variant (default) ─────────────────────────────────────── */

  :host {
    display: inline-flex;
    background: var(--theme-color-background);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
  }

  .pills {
    display: contents;
  }

  .pill {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--theme-color-text-secondary);
    font-family: inherit;
    font-size: 0.875rem;
    padding: 0.4375rem 0.875rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.15s ease, box-shadow 0.15s ease, color 0.15s ease;
  }

  .pill:hover:not([data-disabled]):not(.active) {
    background: color-mix(in srgb, var(--theme-color-text-primary) 6%, transparent);
    color: var(--theme-color-text-primary);
  }

  .pill.active {
    background: var(--theme-color-surface);
    box-shadow: var(--theme-shadow-sm);
    color: var(--theme-color-text-primary);
  }

  .pill[data-disabled] {
    cursor: not-allowed;
    opacity: 0.45;
  }

  /* ── Tabs variant ────────────────────────────────────────────────── */

  :host([variant='tabs']) {
    display: flex;
    background: transparent;
    border-radius: 0;
    padding: 0;
    gap: 0;
    border-bottom: 1px solid var(--theme-color-border);
    width: 100%;
  }

  :host([variant='tabs']) .pills {
    display: contents;
  }

  :host([variant='tabs']) .pill {
    background: transparent;
    border-radius: 0;
    padding: 0.625rem 1.25rem;
    color: var(--theme-color-text-secondary);
    border-bottom: 2px solid transparent;
    /* Offset the border-bottom so it overlaps the host border-bottom */
    margin-bottom: -1px;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  :host([variant='tabs']) .pill:hover:not([data-disabled]):not(.active) {
    background: transparent;
    color: var(--theme-color-text-primary);
  }

  :host([variant='tabs']) .pill.active {
    background: transparent;
    box-shadow: none;
    color: var(--theme-color-primary);
    border-bottom: 2px solid var(--theme-color-primary);
  }
`;
