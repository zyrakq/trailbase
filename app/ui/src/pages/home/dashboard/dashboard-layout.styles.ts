import { css } from 'lit';

export const dashboardLayoutStyles = css`
  :host {
    display: block;
  }

  .layout {
    display: flex;
    gap: 1.5rem;
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .loading {
    color: var(--theme-color-text-secondary);
    text-align: center;
    padding: 2rem 1rem;
    margin: 0;
  }

  dashboard-sidebar {
    width: 220px;
    flex-shrink: 0;
    position: sticky;
    top: 1.5rem;
    align-self: flex-start;
  }

  @media (max-width: 768px) {
    .layout {
      flex-direction: column;
      padding: 1rem;
    }

    dashboard-sidebar {
      width: 100%;
      position: static;
    }
  }
`;
