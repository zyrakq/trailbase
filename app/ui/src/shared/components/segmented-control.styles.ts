import { css } from 'lit';

export const segmentedControlStyles = css`
  :host {
    display: inline-flex;
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--theme-color-surface);
  }

  .pills {
    display: contents;
  }

  .pill {
    appearance: none;
    border: none;
    border-right: 1px solid var(--theme-color-border);
    background: transparent;
    color: var(--theme-color-text-secondary);
    font-family: inherit;
    font-size: 0.875rem;
    padding: 0.4375rem 0.875rem;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .pill:last-child {
    border-right: none;
  }

  .pill:hover:not([data-disabled]):not(.active) {
    background: var(--theme-color-background);
    color: var(--theme-color-text-primary);
  }

  .pill.active {
    background: var(--theme-color-primary);
    color: #fff;
  }

  .pill[data-disabled] {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;
