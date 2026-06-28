import { css } from 'lit';

export const footerInfoStyles = css`
  :host {
    display: block;
    width: 100%;
  }

  footer {
    background: var(--theme-color-surface);
    border-top: 1px solid var(--theme-color-border);
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    color: var(--theme-color-text-secondary);
    font-size: 0.875rem;
    transition: color 0.2s ease;
  }

  .links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .separator {
    color: var(--theme-color-border);
    transition: color 0.2s ease;
  }

  a {
    color: var(--theme-color-text-secondary);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: var(--theme-color-primary);
  }

  @media (max-width: 768px) {
    .footer-content {
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
    }

    .links {
      justify-content: center;
    }
  }
`;
