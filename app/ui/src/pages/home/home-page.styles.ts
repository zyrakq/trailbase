import { css } from 'lit';

export const homePageStyles = css`
  :host {
    display: block;
    min-height: 100vh;
  }

  .page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--theme-color-background);
    transition: background-color 0.2s ease;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .loading {
    margin: 4rem auto;
    color: var(--theme-color-text-secondary);
  }
`;
