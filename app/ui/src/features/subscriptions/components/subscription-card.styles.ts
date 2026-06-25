import { css } from 'lit';

export const subscriptionCardStyles = css`
  :host {
    display: block;
  }

  .card {
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .card:hover {
    border-color: var(--theme-color-primary, #6366f1);
    box-shadow: var(--theme-shadow-md);
  }

  .logo-hero {
    height: 160px;
    background: var(--theme-color-background);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .logo-img {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
  }

  .logo-letter {
    font-size: 4rem;
    font-weight: 700;
    color: var(--theme-color-text-secondary);
  }

  .card-footer {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge-active {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    background: var(--theme-color-success-subtle, rgba(34, 197, 94, 0.15));
    color: var(--theme-color-success, #16a34a);
    white-space: nowrap;
  }

  .price-chip {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
  }

  .actions {
    display: flex;
    gap: 0.375rem;
    align-items: center;
    margin-top: auto;
    padding-top: 0.25rem;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--theme-color-border);
    background: transparent;
    color: var(--theme-color-text-secondary);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    flex-shrink: 0;
  }

  .icon-btn svg {
    width: 18px;
    height: 18px;
  }

  .icon-btn:hover:not(:disabled) {
    background: var(--theme-color-background);
    border-color: var(--theme-color-text-secondary);
    color: var(--theme-color-text-primary);
  }

  .icon-btn.primary {
    border-color: var(--theme-color-primary, #6366f1);
    color: var(--theme-color-primary, #6366f1);
  }

  .icon-btn.primary:hover:not(:disabled) {
    background: var(--theme-color-primary-subtle, rgba(99, 102, 241, 0.08));
  }

  .icon-btn.danger {
    border-color: var(--theme-color-error, #ef4444);
    color: var(--theme-color-error, #ef4444);
  }

  .icon-btn.danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.08);
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
