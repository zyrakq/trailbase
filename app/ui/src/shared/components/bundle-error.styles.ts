import { css } from 'lit';

export const bundleErrorStyles = css`
  :host {
    display: block;
  }

  .status-card {
    background: var(--theme-color-surface);
    border-radius: 8px;
    box-shadow: var(--theme-shadow-md);
    padding: 2rem;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
    transition:
      background-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .status-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .error-icon {
    background: var(--theme-color-error);
  }

  .status-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0;
    transition: color 0.2s ease;
  }

  .status-message {
    font-size: 0.875rem;
    color: var(--theme-color-text-secondary);
    margin: 0;
    line-height: 1.5;
    transition: color 0.2s ease;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9375rem;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-family: inherit;
    width: 100%;
  }

  .btn-primary {
    background: var(--theme-color-primary);
    color: white;
    transition: background-color 0.2s ease;
  }

  .btn-primary:hover {
    background: var(--theme-color-primary-hover);
  }

  .btn-primary:active {
    background: var(--theme-color-primary-active);
  }

  @media (max-width: 640px) {
    .status-card {
      padding: 1.5rem 1rem;
    }
  }
`;
