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

  .backdrop {
    display: none;
  }

  .mobile-period-bar {
    display: none;
  }

  @media (max-width: 768px) {
    .layout {
      flex-direction: column;
      padding: 1rem;
    }

    .layout.bar-visible {
      padding-bottom: 56px;
    }

    dashboard-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 220px;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      z-index: 1500;
      background: var(--theme-color-surface);
      box-shadow: var(--theme-shadow-lg, var(--theme-shadow-md));
      overflow-y: auto;
    }

    .layout.drawer-open dashboard-sidebar {
      transform: translateX(0);
    }

    .layout.drawer-open .backdrop {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1400;
    }

    .mobile-period-bar {
      display: flex;
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 56px;
      background: var(--theme-color-surface);
      border-top: 1px solid var(--theme-color-border);
      z-index: 900;
      align-items: center;
      padding: 0 1rem;
    }

    .period-trigger {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--theme-color-text-primary);
      font-family: inherit;
      font-size: 0.9375rem;
      padding: 0.5rem;
    }

    .period-trigger .chevron {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
    }

    .period-trigger .chevron.open {
      transform: rotate(180deg);
    }

    .period-dropdown {
      position: absolute;
      bottom: calc(100% + 4px);
      left: 1rem;
      right: 1rem;
      background: var(--theme-color-surface-elevated, var(--theme-color-surface));
      border: 1px solid var(--theme-color-border);
      border-radius: 8px;
      box-shadow: var(--theme-shadow-md);
      z-index: 950;
      overflow: hidden;
    }

    .period-option {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.625rem 1rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--theme-color-text-secondary);
      font-family: inherit;
      font-size: 0.9375rem;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .period-option:hover {
      background: var(--theme-color-background);
      color: var(--theme-color-text-primary);
    }

    .period-option.active {
      color: var(--theme-color-primary, #6366f1);
      font-weight: 600;
    }
  }
`;
