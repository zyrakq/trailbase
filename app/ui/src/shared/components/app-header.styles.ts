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
    align-items: center;
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
  .login-btn:hover {
    background: var(--theme-color-primary-hover);
  }
  .login-btn:active {
    background: var(--theme-color-primary-active);
  }

  .burger-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--theme-color-text-primary);
    transition: background 0.15s ease;
    flex-shrink: 0;
  }
  .burger-btn:hover {
    background: var(--theme-color-primary-subtle);
  }
  .burger-btn svg {
    width: 22px;
    height: 22px;
  }

  .mobile-drawer {
    position: fixed;
    top: 73px;
    left: 0;
    width: 100vw;
    bottom: 0;
    background: var(--theme-color-surface);
    z-index: 1585;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }
  .mobile-drawer.open {
    transform: translateX(0);
  }

  .drawer-profile {
    padding: 1.5rem 1.25rem 1.25rem;
    border-bottom: 1px solid var(--theme-color-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.25rem;
    box-sizing: border-box;
    width: 100%;
  }

  .drawer-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 0.5rem;
  }

  .drawer-avatar-initials {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.25rem;
    color: #fff;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }

  .drawer-username {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--theme-color-text-primary);
  }

  .drawer-user-subtitle {
    font-size: 0.8rem;
    color: var(--theme-color-text-muted);
  }

  .drawer-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--theme-color-border);
    cursor: pointer;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    text-align: left;
  }
  .drawer-row:hover {
    background: var(--theme-color-primary-subtle);
  }

  .drawer-row.danger .drawer-row-label {
    color: var(--theme-color-error);
  }
  .drawer-row.danger .drawer-row-icon {
    color: var(--theme-color-error);
  }
  .drawer-row.danger:hover {
    background: color-mix(in srgb, var(--theme-color-error) 8%, transparent);
  }

  .drawer-row-icon {
    width: 20px;
    height: 20px;
    color: var(--theme-color-text-secondary);
    flex-shrink: 0;
  }

  .drawer-row-label {
    flex: 1;
    color: var(--theme-color-text-primary);
    font-size: 0.95rem;
  }

  .drawer-row-value {
    font-size: 1.1rem;
    line-height: 1;
  }

  .drawer-row-chevron {
    width: 16px;
    height: 16px;
    color: var(--theme-color-text-muted);
    flex-shrink: 0;
  }

  .theme-switch {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }

  .theme-track {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: var(--theme-color-border);
    transition: background 0.2s ease;
  }
  .theme-track.active {
    background: var(--theme-color-primary);
  }

  .theme-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
    pointer-events: none;
  }
  .theme-track.active .theme-thumb {
    transform: translateX(20px);
  }

  @media (max-width: 768px) {
    :host {
      position: sticky;
      top: 0;
      z-index: 1600;
    }

    .actions {
      display: none;
    }

    .burger-btn {
      display: flex;
    }
  }

  @media (max-width: 640px) {
    .header-content {
      padding: 0.75rem 1rem;
    }

    .mobile-drawer {
      top: 65px;
    }

  }
`;
