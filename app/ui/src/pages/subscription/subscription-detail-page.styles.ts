import { css } from 'lit';

export const subscriptionDetailPageStyles = css`
  :host {
    display: block;
    min-height: var(--full-vh, 100vh);
    background: var(--theme-color-background);
  }

  .page-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .loading,
  .not-found {
    text-align: center;
    color: var(--theme-color-text-secondary);
    padding: 4rem 0;
  }

  .back-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--theme-color-text-secondary);
    font-size: 0.9375rem;
    font-family: inherit;
    padding: 0.375rem 0.5rem;
    border-radius: 6px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .btn-back:hover {
    color: var(--theme-color-text-primary);
    background: var(--theme-color-surface);
  }

  .btn-back svg {
    width: 18px;
    height: 18px;
  }

  .btn-edit {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.875rem;
    background: transparent;
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    color: var(--theme-color-text-primary);
    font-size: 0.9375rem;
    text-decoration: none;
    transition: background-color 0.15s ease;
  }

  .btn-edit:hover {
    background: var(--theme-color-surface);
  }

  .detail-card {
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--theme-shadow-sm);
  }

  .logo-hero {
    height: 200px;
    background: var(--theme-color-background);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-img {
    max-width: 60%;
    max-height: 60%;
    object-fit: contain;
  }

  .logo-letter {
    font-size: 5rem;
    font-weight: 700;
    color: var(--theme-color-text-secondary);
  }

  .detail-body {
    padding: 1.5rem 2rem 2rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
  }

  .badge-active {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--theme-color-success-subtle, rgba(34, 197, 94, 0.15));
    color: var(--theme-color-success, #16a34a);
  }

  .badge-archived {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--theme-color-border);
    color: var(--theme-color-text-secondary);
  }

  .badge-cancelled {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--theme-color-error-subtle, rgba(239, 68, 68, 0.15));
    color: var(--theme-color-error, #ef4444);
  }

  .badge-activating {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--theme-color-warning-subtle, rgba(245, 158, 11, 0.15));
    color: var(--theme-color-warning, #d97706);
  }

  .badge-spinner {
    width: 10px;
    height: 10px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .badge-failed {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--theme-color-error-subtle, rgba(239, 68, 68, 0.15));
    color: var(--theme-color-error, #ef4444);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .description {
    color: var(--theme-color-text-secondary);
    line-height: 1.6;
    margin: 0 0 1.5rem;
  }

  .section-heading {
    font-size: 1rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0 0 0.75rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section-text {
    color: var(--theme-color-text-secondary);
    line-height: 1.6;
    margin: 0;
  }

  .pricing-section {
    margin-bottom: 1.5rem;
  }

  .pricing-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pricing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .pricing-row:hover {
    border-color: var(--theme-color-primary, #6366f1);
  }

  .pricing-row.selected {
    border-color: var(--theme-color-primary, #6366f1);
    background: var(--theme-color-primary-subtle, rgba(99, 102, 241, 0.08));
  }

  .period-name {
    font-size: 0.9375rem;
    color: var(--theme-color-text-primary);
  }

  .price-value {
    font-weight: 700;
    font-size: 1rem;
    color: var(--theme-color-text-primary);
  }

  .access-section {
    display: flex;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .btn-access {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    background: var(--theme-color-primary, #6366f1);
    color: #fff;
    text-decoration: none;
    font-weight: 500;
  }

  .cta-row {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.75rem;
  }

  .btn-subscribe,
  .btn-cancel {
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-family: inherit;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.15s ease;
  }

  .btn-subscribe {
    background: var(--theme-color-primary, #6366f1);
    border: none;
    color: #fff;
  }

  .btn-subscribe:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-cancel {
    background: transparent;
    border: 1px solid var(--theme-color-error, #ef4444);
    color: var(--theme-color-error, #ef4444);
  }

  .btn-cancel:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.05);
  }

  .btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .login-cta {
    margin-top: 1.5rem;
    color: var(--theme-color-text-secondary);
    font-style: italic;
  }

  .sign-in-hint {
    margin-top: 1.5rem;
    color: var(--theme-color-text-secondary);
    font-style: italic;
  }

  .archived-notice {
    text-align: center;
    color: var(--theme-color-text-secondary);
    font-style: italic;
    margin-top: 0.5rem;
  }

  @media (max-width: 640px) {
    .page-content {
      padding: 1rem;
    }

    .detail-body {
      padding: 1rem;
    }

    .title {
      font-size: 1.375rem;
    }
  }
`;
