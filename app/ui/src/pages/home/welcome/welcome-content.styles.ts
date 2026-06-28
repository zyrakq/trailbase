import { css } from 'lit';

export const welcomeContentStyles = css`
  :host {
    display: block;
  }

  .welcome {
    max-width: 720px;
    margin: 0 auto;
    padding: 4rem 1.5rem;
    text-align: center;
  }

  .hero h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0 0 1rem;
  }

  .subtitle {
    font-size: 1.125rem;
    color: var(--theme-color-text-secondary);
    margin: 0 auto 2.5rem;
    max-width: 560px;
  }

  .features {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.5rem;
    margin: 3rem 0;
    text-align: left;
  }

  .feature-card {
    flex: 1 1 280px;
    max-width: 360px;
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: var(--theme-shadow-md);
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      color 0.2s ease;
  }

  .feature-card svg {
    width: 32px;
    height: 32px;
    color: var(--theme-color-primary);
  }

  .feature-card h3 {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--theme-color-text-primary);
    margin: 0.75rem 0 0.5rem;
  }

  .feature-card p {
    font-size: 0.9375rem;
    color: var(--theme-color-text-secondary);
    margin: 0;
  }

  .cta {
    margin-top: 2.5rem;
  }

  .btn-primary {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 500;
    background: var(--theme-color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    transition: background-color 0.2s ease;
  }

  .btn-primary:hover {
    background: var(--theme-color-primary-hover);
  }

  .btn-primary:active {
    background: var(--theme-color-primary-active);
  }

  @media (max-width: 640px) {
    .welcome {
      padding: 2rem 1rem;
    }

    .hero h1 {
      font-size: 2rem;
    }
  }
`;
