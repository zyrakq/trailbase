import { css } from 'lit';

export const appHeaderStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--theme-color-surface);
    border-bottom: 1px solid var(--theme-color-border);
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .logo-link {
    display: inline-flex;
    color: inherit;
    text-decoration: none;
  }

  .logo-mark {
    height: 40px;
    width: auto;
  }

  .actions {
    display: flex;
    gap: 1rem;
  }

  .login-btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.9375rem;
    font-weight: 500;
    background: var(--theme-color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: background-color 0.2s ease;
  }
  .login-btn:hover { background: var(--theme-color-primary-hover); }
  .login-btn:active { background: var(--theme-color-primary-active); }

  @media (max-width: 640px) {
    .header-content {
      padding: 0.75rem 1rem;
    }
  }
`;
