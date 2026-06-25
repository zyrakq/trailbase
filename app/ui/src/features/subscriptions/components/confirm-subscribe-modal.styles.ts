import { css } from 'lit';

export const confirmSubscribeModalStyles = css`
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .modal {
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 400px;
    width: 100%;
    box-shadow: var(--theme-shadow-lg, var(--theme-shadow-md));
  }

  .title {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
  }

  .sub-name {
    margin: 0 0 1.25rem;
    color: var(--theme-color-text-secondary);
    font-size: 1rem;
  }

  .period-group {
    border: none;
    padding: 0;
    margin: 0 0 1.25rem;
  }

  .period-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--theme-color-text-secondary);
    margin-bottom: 0.5rem;
    display: block;
  }

  .period-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--theme-color-border);
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .period-option.selected {
    border-color: var(--theme-color-primary, #6366f1);
    background: var(--theme-color-primary-subtle, rgba(99, 102, 241, 0.08));
  }

  .period-option input[type="radio"] {
    accent-color: var(--theme-color-primary, #6366f1);
  }

  .period-name {
    flex: 1;
    font-size: 0.9375rem;
  }

  .period-price {
    font-weight: 600;
    color: var(--theme-color-text-primary);
  }

  .price-single {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1.25rem;
    color: var(--theme-color-text-primary);
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn-cancel,
  .btn-confirm {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    font-size: 0.9375rem;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s ease, background-color 0.15s ease;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--theme-color-border);
    color: var(--theme-color-text-primary);
  }

  .btn-cancel:hover:not(:disabled) {
    background: var(--theme-color-background);
  }

  .btn-confirm {
    background: var(--theme-color-primary, #6366f1);
    border: 1px solid transparent;
    color: #fff;
    font-weight: 600;
  }

  .btn-confirm:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-cancel:disabled,
  .btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
