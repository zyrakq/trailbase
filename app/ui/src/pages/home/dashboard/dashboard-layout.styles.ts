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

  .mobile-toolbar {
    display: none;
  }

  .menu-btn {
    display: none;
  }

  .period-overlay {
    display: none;
  }

  .period-sheet {
    display: none;
  }

  @media (max-width: 768px) {
    .layout {
      flex-direction: column;
      padding: 1rem;
      padding-top: calc(125px + 1rem);
    }

    .mobile-toolbar {
      display: flex;
      position: sticky;
      top: 73px;
      z-index: 1550;
      background: var(--theme-color-surface);
      border-bottom: 1px solid var(--theme-color-border);
      padding: 0 1rem;
      height: 52px;
      align-items: center;
      justify-content: space-between;
    }

    .menu-btn {
      display: inline-flex;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      color: var(--theme-color-text-primary);
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .menu-btn:hover {
      background: var(--theme-color-background);
    }

    .menu-btn svg {
      width: 24px;
      height: 24px;
    }

    dashboard-sidebar {
      position: fixed;
      top: 125px;
      left: 0;
      right: 0;
      bottom: 0;
      width: auto;
      height: calc(100vh - 125px);
      transform: translateX(-100%);
      z-index: 1500;
      background: var(--theme-color-surface);
      box-shadow: var(--theme-shadow-lg, var(--theme-shadow-md));
      overflow-y: auto;
    }

    .layout.drawer-open dashboard-sidebar {
      transform: translateX(0);
    }

    .layout.drawer-animated dashboard-sidebar {
      transition: transform 0.3s ease;
    }

    .period-overlay {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 950;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }

    .period-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .period-sheet {
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 125px;
      left: 0;
      right: 0;
      background: var(--theme-color-surface);
      border-bottom: 1px solid var(--theme-color-border);
      z-index: 960;
      transform: translateY(-100%);
      transition: transform 0.25s ease;
      box-shadow: var(--theme-shadow-md);
    }

    .period-sheet.open {
      transform: translateY(0);
    }

    .period-trigger {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .period-option {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.75rem 1rem;
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

  @media (max-width: 640px) {
    .layout {
      padding-top: calc(117px + 1rem);
    }

    .mobile-toolbar {
      top: 65px;
    }

    dashboard-sidebar {
      top: 117px;
      height: calc(100vh - 117px);
    }

    .period-sheet {
      top: 117px;
    }
  }
`;
