import { css } from 'lit';

export const subscriptionsGridStyles = css`
  :host {
    display: block;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .skeleton {
    height: 160px;
    border-radius: 8px;
    background: var(--theme-color-surface);
    border: 1px solid var(--theme-color-border);
    position: relative;
    overflow: hidden;
  }

  .skeleton::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.08),
      transparent
    );
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: -400px 0;
    }
    100% {
      background-position: 400px 0;
    }
  }

  .empty {
    color: var(--theme-color-text-secondary);
    text-align: center;
    padding: 3rem 1rem;
  }

  .link {
    background: none;
    border: none;
    color: var(--theme-color-primary);
    cursor: pointer;
    text-decoration: underline;
    font-family: inherit;
  }
`;
