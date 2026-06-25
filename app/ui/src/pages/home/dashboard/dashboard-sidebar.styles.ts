import { css } from 'lit';

export const dashboardSidebarStyles = css`
  :host {
    display: block;
  }

  .nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--theme-color-text-primary);
    font-family: inherit;
    font-size: 0.9375rem;
    text-align: left;
    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .nav-item:hover {
    background: var(--theme-color-background);
  }

  .nav-item:active {
    background: var(--theme-color-surface-elevated, var(--theme-color-surface));
  }

  .nav-item.active {
    background: var(--theme-color-primary);
    color: var(--theme-color-surface);
  }

  .icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .period-filter {
    padding: 1rem 0.75rem 0.75rem;
    border-top: 1px solid var(--theme-color-border);
    margin-top: 0.5rem;
  }

  .filter-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--theme-color-text-secondary);
    margin-bottom: 0.5rem;
    padding-left: 0.25rem;
  }

  .period-btn {
    display: block;
    width: 100%;
    text-align: left;
    padding: 0.4rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.875rem;
    color: var(--theme-color-text-secondary);
    transition: background-color 0.15s ease, color 0.15s ease;
    margin-bottom: 0.125rem;
  }

  .period-btn:hover {
    background: var(--theme-color-background);
    color: var(--theme-color-text-primary);
  }

  .period-btn.active {
    background: var(--theme-color-primary-subtle, rgba(99, 102, 241, 0.1));
    color: var(--theme-color-primary, #6366f1);
    font-weight: 600;
  }
`;
