import { css } from 'lit';

export const adminPageStyles = css`
  :host {
    display: block;
    min-height: var(--full-vh, 100vh);
    background: var(--theme-color-background);
    transition: background-color 0.2s ease;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .page {
    display: flex;
    flex-direction: column;
    min-height: var(--full-vh, 100vh);
  }

  .main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .header h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--theme-color-text-primary);
    margin: 0;
    transition: color 0.2s ease;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .row {
    display: grid;
    grid-template-columns: 40px 1fr auto auto;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .logo {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: contain;
    background: var(--theme-color-surface-elevated, var(--theme-color-surface));
  }

  .logo-fallback {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--theme-color-primary);
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .name {
    font-weight: 500;
    color: var(--theme-color-text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex-wrap: wrap;
    transition: color 0.2s ease;
  }

  .name > span:first-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .badge.active {
    background: var(--theme-color-success);
    color: white;
  }

  .badge.archived {
    background: var(--theme-color-text-muted, var(--theme-color-text-secondary));
    color: white;
  }

  .badge.no-pricing {
    background: var(--theme-color-warning, #f59e0b);
    color: white;
  }

  .count {
    color: var(--theme-color-text-secondary);
    font-size: 0.875rem;
    transition: color 0.2s ease;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid var(--theme-color-border);
    border-radius: 6px;
    background: transparent;
    color: var(--theme-color-text-primary);
    cursor: pointer;
    font-family: inherit;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease;
  }

  .btn:hover:not(:disabled) {
    background: var(--theme-color-surface-hover, var(--theme-color-surface));
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--theme-color-primary);
    color: white;
    border-color: transparent;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--theme-color-primary-hover);
  }

  .btn-primary:active:not(:disabled) {
    background: var(--theme-color-primary-active);
  }

  .btn-primary svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .btn-icon {
    padding: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-icon svg {
    width: 16px;
    height: 16px;
    display: block;
  }

  .btn-danger {
    color: var(--theme-color-error);
    border-color: var(--theme-color-border);
  }

  .btn-danger:hover:not(:disabled) {
    background: var(--theme-color-error);
    color: white;
    border-color: var(--theme-color-error);
  }

  .empty,
  .loading {
    color: var(--theme-color-text-secondary);
    text-align: center;
    padding: 3rem 1rem;
    transition: color 0.2s ease;
  }

  .denied {
    max-width: 480px;
    margin: 4rem auto;
    text-align: center;
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    padding: 2.5rem 1.5rem;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .denied h2 {
    color: var(--theme-color-text-primary);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
    transition: color 0.2s ease;
  }

  .denied p {
    color: var(--theme-color-text-secondary);
    margin: 0;
    transition: color 0.2s ease;
  }

  @media (max-width: 720px) {
    .row {
      grid-template-columns: 40px 1fr auto;
    }

    .count {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .main {
      padding: 1rem;
    }

    .header h1 {
      font-size: 1.375rem;
    }

    .row {
      padding: 0.625rem 0.75rem;
      gap: 0.625rem;
    }
  }
`;
